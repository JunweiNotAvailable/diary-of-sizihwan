import { View, Text, FlatList, StyleSheet, Image, SafeAreaView, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { Categories, Colors, Locations } from '../../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import PrettyButton from '../../components/PrettyButton';
import { ChevronDownIcon, PersonIcon, ThumbsUpIcon, TranslateIcon, PrettyLoadingIcon } from '../../utils/Svgs';
import { getTimeFromNow } from '../../utils/Functions';
import { Config } from '../../utils/Config';
import { MarkdownText } from '../../components';
import { Platform } from 'react-native';

const RelevantReviewsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { reviews = [] } = route.params || {};
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedReviews, setTranslatedReviews] = useState<Record<string, string>>({});
  const [showingTranslations, setShowingTranslations] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const { user, locale } = useAppState();
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch users for the reviews
    (async () => {
      await loadUsers();
    })();
  }, []);

  const loadUsers = async () => {
    try {
      // Extract user IDs from reviews, making sure they're strings
      const userIds: string[] = [];
      reviews.forEach((item: any) => {
        if (item?.review?.user_id && typeof item.review.user_id === 'string') {
          userIds.push(item.review.user_id);
        }
      });
      
      const uniqueUserIds = [...new Set(userIds)];
      await loadMoreUsers(uniqueUserIds);
    } catch (error) {
      setError(t('reviews.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreUsers = async (userIds: string[]) => {
    const newUsers: UserModel[] = [];
    for (const userId of userIds) {
      if (users.find((user: UserModel) => user.id === userId)) continue;
      const res = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
      const userData = (await res.json()).data;
      newUsers.push(userData);
    }
    setUsers(prev => [...prev, ...newUsers]);
  };

  const toggleLike = async (review: ReviewModel) => {
    if (!user?.id || !review?.id) return;
    
    // Create a new review object with updated likes
    const newReview: ReviewModel = { 
      ...review, 
      extra: { 
        ...review.extra, 
        likes: review.extra.likes.includes(user?.id) 
          ? review.extra.likes.filter((id: string) => id !== user?.id) 
          : [...review.extra.likes, user?.id] 
      } 
    };
    
    // Update the review in the database
    await fetch(`${Config.api.url}/data?table=reviews&id=${review.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ extra: newReview.extra })
    });
  };

  // Safe translation function that does type checking
  const translateReview = async (reviewId: string, content: string) => {
    // If we already have the translation, just toggle visibility
    if (translatedReviews[reviewId]) {
      setShowingTranslations(prev => ({
        ...prev,
        [reviewId]: !prev[reviewId]
      }));
      return;
    }

    // Set as translating
    setIsTranslating(prev => ({
      ...prev,
      [reviewId]: true
    }));

    try {
      // Determine source language based on current locale
      const sourceLang = locale === 'zh' ? 'en' : 'zh-TW';
      const targetLang = locale === 'zh' ? 'zh-TW' : 'en';

      // Make the translation request
      const response = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: content,
          sourceLang,
          targetLang,
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = (await response.json()).data;

      // Store the translated text
      setTranslatedReviews(prev => ({
        ...prev,
        [reviewId]: data.translatedText
      }));

      // Show the translation
      setShowingTranslations(prev => ({
        ...prev,
        [reviewId]: true
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(prev => ({
        ...prev,
        [reviewId]: false
      }));
    }
  };

  const translateAllReviews = async () => {
    if (isTranslatingAll || reviews.length === 0) return;

    setIsTranslatingAll(true);

    try {
      // Determine source language based on current locale
      const sourceLang = locale === 'zh' ? 'en' : 'zh-TW';
      const targetLang = locale === 'zh' ? 'zh-TW' : 'en';

      // Process reviews in batches to update UI more frequently
      const processReviews = async () => {
        for (const item of reviews) {
          if (!item?.review?.id || !item?.review?.content) continue;
          
          const review = item.review;
          const reviewId = review.id;
          const content = review.content;
          
          // Skip if already translated
          if (translatedReviews[reviewId] && showingTranslations[reviewId]) continue;

          // Set as translating for this specific review
          setIsTranslating(prev => ({
            ...prev,
            [reviewId]: true
          }));

          try {
            // Make the translation request
            const response = await fetch(`${Config.api.url}/translate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: content,
                sourceLang,
                targetLang,
              })
            });

            if (!response.ok) {
              console.error(`Translation failed for review ${reviewId}`);
              continue; // Skip to next review instead of stopping everything
            }

            const data = (await response.json()).data;

            // Store the translated text
            setTranslatedReviews(prev => ({
              ...prev,
              [reviewId]: data.translatedText
            }));

            // Show the translation
            setShowingTranslations(prev => ({
              ...prev,
              [reviewId]: true
            }));
          } catch (error) {
            console.error(`Error translating review ${reviewId}:`, error);
          } finally {
            // Clear translating state for this review
            setIsTranslating(prev => ({
              ...prev,
              [reviewId]: false
            }));
          }
        }
      };

      // Start the translation process
      processReviews().finally(() => {
        setIsTranslatingAll(false);
      });
    } catch (error) {
      console.error('Bulk translation error:', error);
      setIsTranslatingAll(false);
    }
  };

  const renderReviewItem = ({ item }: { item: any }) => {
    // Check if the item has a valid review property
    if (!item?.review?.id || !item?.review?.content) {
      return null;
    }
    
    const review: ReviewModel = item.review;
    const score: number = typeof item.score === 'number' ? item.score : 0;
    
    const reviewUser = users.find((u: UserModel) => u.id === review.user_id);
    if (!reviewUser) return null;

    const isShowingTranslation = showingTranslations[review.id] || false;
    const isCurrentlyTranslating = isTranslating[review.id] || false;

    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation && translatedReviews[review.id] 
      ? translatedReviews[review.id] 
      : review.content;

    // Calculate relevance percentage (ensure it's between 10-100%)
    const relevancePercentage = Math.round(Math.min(Math.max(score * 100, 10), 100));

    return (
      <View style={styles.reviewItem}>
        {/* Relevance score indicator */}
        <View style={styles.relevanceContainer}>
          <Text style={styles.relevanceLabel}>{t('ask.relevanceScore')}: {relevancePercentage}</Text>
        </View>

        <View style={styles.reviewHeader}>
          <TouchableWithoutFeedback onPress={() => navigation.navigate('UserProfile', { userId: reviewUser.id })}>
            <View style={styles.userInfo}>
              {(reviewUser.picture) ? (
                <Image
                  source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${reviewUser.picture}` }}
                  style={styles.userImage}
                />
              ) : (
                <View style={[styles.userImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <View style={{ marginTop: 4 }}>
                    <PersonIcon width={24} height={24} fill={Colors.primaryGray + '44'} />
                  </View>
                </View>
              )}
              <View style={styles.userTextContainer}>
                <Text style={styles.userName}>
                  {reviewUser.name}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.reviewDate}>{getTimeFromNow(review.created_at)}</Text>
        </View>

        <Text style={styles.locationText}>{Locations.nsysu.find((location: any) => location.id === review.location)?.[locale === 'zh' ? 'name' : 'name_en']}</Text>

        <Text style={styles.reviewTitle}>{review.title}</Text>

        <View style={styles.contentContainer}>
          <MarkdownText style={styles.reviewContent}>
            {displayContent}
          </MarkdownText>

          <View style={styles.contentActions}>
            {/* Translate button */}
            <PrettyButton
              style={styles.translateButton}
              onPress={() => {
                // Type guard to ensure both are strings before calling translateReview
                if (typeof review.id === 'string' && typeof review.content === 'string') {
                  translateReview(review.id, review.content);
                }
              }}
              disabled={isCurrentlyTranslating}
            >
              <View style={styles.translateButtonContent}>
                <TranslateIcon width={16} height={16} fill={Colors.primaryGray + '88'} />
              </View>
            </PrettyButton>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {review.categories && review.categories.map((category, index) => (
              <View key={index} style={[styles.categoryTag, { backgroundColor: Categories.find((c: any) => c.name === category)?.color + '1a' }]}>
                <Text style={[styles.categoryText, { color: Categories.find((c: any) => c.name === category)?.color }]}>{t(`categories.${category}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTranslateHeader = () => {
    if (reviews.length === 0) return null;
    
    return (
      <View style={styles.beforeListContainer}>
        <PrettyButton
          style={styles.translateAllButton}
          onPress={translateAllReviews}
          disabled={isTranslatingAll || reviews.length === 0}
        >
          <View style={styles.translateAllButtonContent}>
            {isTranslatingAll ? (
              <PrettyLoadingIcon width={16} height={16} stroke={Colors.primaryGray + '88'} />
            ) : (
              <TranslateIcon width={16} height={16} fill={Colors.primaryGray + '88'} />
            )}
            <Text style={styles.translateAllButtonText}>
              {t('reviews.translateAll', 'Translate all')}
            </Text>
          </View>
        </PrettyButton>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PrettyButton
          style={[styles.headerButton, { alignItems: 'flex-start' }]}
          onPress={() => navigation.goBack()}
        >
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <ChevronDownIcon width={20} height={20} />
          </View>
        </PrettyButton>
        <Text style={styles.title}>{t('ask.relevantReviews')}</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Translate all button */}
      {renderTranslateHeader()}

      <FlatList
        data={[...reviews].sort((a, b) => {
          const scoreA = typeof a?.score === 'number' ? a.score : 0;
          const scoreB = typeof b?.score === 'number' ? b.score : 0;
          return scoreB - scoreA;
        })}
        removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
        keyExtractor={(item, index) => (item?.review?.id || `review-${index}`)}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('relevantReviews.empty', 'No relevant reviews found')}</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: Colors.primaryLightGray,
    width: '100%',
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 0,
    margin: 0,
    backgroundColor: '#0000',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reviewsList: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  reviewItem: {
    padding: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
  },
  relevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  relevanceLabel: {
    fontSize: 14,
    color: '#888',
  },
  relevanceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  relevanceFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  relevancePercentage: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
    color: Colors.primary,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLightGray,
  },
  userTextContainer: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  contentContainer: {
    marginBottom: 6,
  },
  reviewContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  categoriesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#888',
  },
  likesContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  likesText: {
    fontSize: 10,
  },
  translateButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  translateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: Colors.primaryGray,
  },
  beforeListContainer: {
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  translateAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#0000',
    alignItems: 'center',
  },
  translateAllButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  translateAllButtonText: {
    color: Colors.primaryGray + '88',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default RelevantReviewsScreen;