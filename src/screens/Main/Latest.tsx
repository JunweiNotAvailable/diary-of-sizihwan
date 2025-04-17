import { View, Text, FlatList, StyleSheet, Image, Alert, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { Colors, Categories, Locations } from '../../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import PrettyButton from '../../components/PrettyButton';
import { ChevronDownIcon, PersonIcon, PlusIcon, PrettyLoadingIcon, ThumbsUpIcon, TranslateIcon } from '../../utils/Svgs';
import { getTimeFromNow } from '../../utils/Functions';
import { Config } from '../../utils/Config';
import { MarkdownText } from '../../components';

const LatestScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [translatedReviews, setTranslatedReviews] = useState<Record<string, string>>({});
  const [showingTranslations, setShowingTranslations] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const { user, locale } = useAppState();
  const { t } = useTranslation();
  // pagination
  const [page, setPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 10;

  useEffect(() => {
    // Fetch reviews and users from database
    (async () => {
      await loadInitialData();
    })();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get reviews
      const newReviews = await loadReviews(0);
      setReviews(newReviews.sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
      setPage(0);
      setHasMoreReviews(newReviews.length === limit);

      // Get users
      await loadMoreUsers(newReviews.map((review: ReviewModel) => review.user_id));
    } catch (error) {
      setError(t('reviews.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load reviews
  const loadReviews = async (page: number) => {
    const res = await fetch(`${Config.api.url}/data?table=reviews&limit=${limit}&offset=${page * limit}&sortBy=created_at&order=desc`);
    const data = await res.json();
    return data.data;
  }

  // Load users
  const loadMoreUsers = async (userIds: string[]) => {
    const newUsers: UserModel[] = [];
    for (const userId of userIds) {
      if (users.find((user: UserModel) => user.id === userId)) continue;
      const res = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
      const userData = (await res.json()).data;
      newUsers.push(userData);
    }
    setUsers(prev => [...prev, ...newUsers]);
  }

  const loadMoreReviews = async () => {
    if (!hasMoreReviews || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const newReviews = await loadReviews(nextPage);

      if (newReviews.length > 0) {
        setReviews(prev => [...prev, ...newReviews].sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
        setPage(nextPage);
        setHasMoreReviews(newReviews.length === limit);

        // Load users for new reviews
        await loadMoreUsers(newReviews.map((review: ReviewModel) => review.user_id));
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleLike = async (review: ReviewModel) => {
    if (!user?.id) return;
    const newReview: ReviewModel = { ...review, extra: { ...review.extra, likes: review.extra.likes.includes(user?.id) ? review.extra.likes.filter((id: string) => id !== user?.id) : [...review.extra.likes, user?.id] } };
    setReviews(prev => prev.map(r => r.id === review.id ? newReview : r));
    await fetch(`${Config.api.url}/data?table=reviews&id=${review.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ extra: newReview.extra })
    });
  }

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

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
      Alert.alert(t('translation.error'), t('translation.errorMessage'));
    } finally {
      setIsTranslating(prev => ({
        ...prev,
        [reviewId]: false
      }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const renderReviewItem = ({ item }: { item: ReviewModel }) => {
    const user = users.find((user: UserModel) => user.id === item.user_id);
    if (!user) return null;

    const isShowingTranslation = showingTranslations[item.id] || false;
    const isCurrentlyTranslating = isTranslating[item.id] || false;

    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation ? translatedReviews[item.id] : item.content;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <TouchableWithoutFeedback onPress={item.extra.is_anonymous ? undefined : () => navigation.navigate('UserProfile', { userId: user.id })}>
            <View style={styles.userInfo}>
              {(!item.extra.is_anonymous && user.picture) ? (
                <Image
                  source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${user.picture}` }}
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
                  {item.extra.is_anonymous ? t('reviews.anonymousUser') : user.name}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
          <Text style={styles.reviewDate}>{getTimeFromNow(item.created_at)}</Text>
        </View>

        <Text style={styles.locationText}>{Locations.nsysu.find((location: any) => location.id === item.location)?.[locale === 'zh' ? 'name' : 'name_en']}</Text>

        <Text style={styles.reviewTitle}>{item.title}</Text>

        <View style={styles.contentContainer}>
          <MarkdownText
            style={styles.reviewContent}
          >
            {displayContent}
          </MarkdownText>

          <View style={styles.contentActions}>
            {/* Translate button */}
            <PrettyButton
              style={styles.translateButton}
              onPress={() => translateReview(item.id, item.content)}
              disabled={isCurrentlyTranslating}
            >
              <View style={styles.translateButtonContent}>
                <TranslateIcon width={16} height={16} fill={Colors.primaryGray + '88'} />
              </View>
            </PrettyButton>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          {/* categories */}
          <View style={styles.categoriesContainer}>
            {item.categories.map((category, index) => (
              <View key={index} style={[styles.categoryTag, { backgroundColor: Categories.find((c: any) => c.name === category)?.color + '1a' }]}>
                <Text style={[styles.categoryText, { color: Categories.find((c: any) => c.name === category)?.color }]}>{t(`categories.${category}`)}</Text>
              </View>
            ))}
          </View>
          {/* likes */}
          <PrettyButton style={styles.likesContainer} onPress={async () => await toggleLike(item)}>
            <ThumbsUpIcon width={24} height={24} fill={item.extra.likes.includes(user?.id) ? Colors.like : Colors.primaryGray + '88'} />
            <Text style={[styles.likesText, { color: item.extra.likes.includes(user?.id) ? Colors.like : Colors.primaryGray + '88' }]}>{item.extra.likes.length}</Text>
          </PrettyButton>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.locationHeader}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} ellipsizeMode="middle" numberOfLines={1}>
            {t('reviews.latest')}
          </Text>
        </View>
        <PrettyButton
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          contentStyle={{ gap: 0 }}
        >
          <View style={{ transform: [{ rotate: '45deg' }], width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <PlusIcon width={14} height={14} />
          </View>
        </PrettyButton>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('reviews.empty')}</Text>
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreReviews}
        onEndReachedThreshold={0.3}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: Colors.primaryGray,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: Colors.primaryGray,
  },
  locationHeader: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: Colors.primaryLightGray,
    width: '100%',
    borderBottomWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 10,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
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
  showMoreButton: {
    paddingVertical: 0,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    marginTop: 0,
  },
  showMoreText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primaryGray,
  },
  // Translation styles
  translateButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  translateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Markdown styles
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  boldItalic: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  underscore: {
    textDecorationLine: 'underline',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});

export default LatestScreen;