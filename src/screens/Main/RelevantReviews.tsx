import { View, Text, FlatList, StyleSheet, Image, SafeAreaView, TouchableWithoutFeedback, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { Categories, Colors, Locations } from '../../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import PrettyButton from '../../components/PrettyButton';
import { ChevronDownIcon, PersonIcon, ThumbsUpIcon, TranslateIcon, PrettyLoadingIcon, PlusIcon } from '../../utils/Svgs';
import { getTimeFromNow } from '../../utils/Functions';
import { Config } from '../../utils/Config';
import { MarkdownText, BottomModal } from '../../components';
import { Platform } from 'react-native';

const RelevantReviewsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { reviews: initialReviews = [] } = route.params || {};
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedReviews, setTranslatedReviews] = useState<Record<string, string>>({});
  const [showingTranslations, setShowingTranslations] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  // Emoji modal
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [emojiReviewId, setEmojiReviewId] = useState<string | null>(null);
  const [isSubmittingEmoji, setIsSubmittingEmoji] = useState(false);
  // Emoji details modal
  const [emojiDetailsModalVisible, setEmojiDetailsModalVisible] = useState(false);
  const [emojiDetailsReview, setEmojiDetailsReview] = useState<ReviewModel | null>(null);
  const [isLoadingEmojiUsers, setIsLoadingEmojiUsers] = useState(false);
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

  const handleEmojiPress = (reviewId: string) => {
    setEmojiReviewId(reviewId);
    setEmojiModalVisible(true);
  };

  const handleSelectEmoji = async (emoji: string) => {
    if (!user || !emojiReviewId) return;

    setIsSubmittingEmoji(true);

    try {
      // Find the review item
      const reviewItem = reviews.find((item: any) => item.review?.id === emojiReviewId);
      if (!reviewItem || !reviewItem.review) return;

      const reviewToUpdate = reviewItem.review;

      // Ensure emojis array exists
      const currentEmojis = reviewToUpdate.extra?.emojis || [];

      // Check if user already added this emoji
      const existingEmojiIndex = currentEmojis.findIndex(
        (e: { user_id: string, emoji: string }) => e.user_id === user.id && e.emoji === emoji
      );

      let updatedEmojis;

      if (existingEmojiIndex !== -1) {
        // Remove emoji if already added (unselect)
        updatedEmojis = [
          ...currentEmojis.slice(0, existingEmojiIndex),
          ...currentEmojis.slice(existingEmojiIndex + 1)
        ];
      } else {
        // Remove any other emoji by this user
        const filteredEmojis = currentEmojis.filter((e: { user_id: string, emoji: string }) => e.user_id !== user.id);

        // Add the new emoji
        updatedEmojis = [
          ...filteredEmojis,
          { user_id: user.id, emoji }
        ];
      }

      // Make sure extra object exists
      const updatedExtra = {
        ...(reviewToUpdate.extra || {}),
        emojis: updatedEmojis
      };

      // Update on server
      const response = await fetch(`${Config.api.url}/data?table=reviews&id=${emojiReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extra: updatedExtra
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update emoji');
      }

      // Update our local state instead of modifying route.params
      setReviews(prevReviews => 
        prevReviews.map((item: any) => {
          if (item.review?.id === emojiReviewId) {
            return {
              ...item,
              review: {
                ...item.review,
                extra: updatedExtra
              }
            };
          }
          return item;
        })
      );
      
      // Update the emoji details review if it's the currently selected one
      if (emojiDetailsReview?.id === emojiReviewId) {
        setEmojiDetailsReview({
          ...emojiDetailsReview,
          extra: updatedExtra
        });
      }

    } catch (error) {
      console.error('Error updating emoji:', error);
      Alert.alert(t('general.error'), t('reviews.emojiUpdateFailed'));
    } finally {
      setIsSubmittingEmoji(false);
      setEmojiModalVisible(false);
    }
  };

  // Check if current user reacted with emoji
  const getUserEmoji = (emojis: { user_id: string, emoji: string }[] = []) => {
    if (!user) return null;

    const userEmoji = emojis.find(e => e.user_id === user.id);
    return userEmoji ? userEmoji.emoji : null;
  };

  // Add a function to handle showing the list of emojis
  const handleShowEmojiList = async (reviewId: string) => {
    const reviewItem = reviews.find((item: any) => item.review?.id === reviewId);
    if (!reviewItem || !reviewItem.review) return;

    setEmojiDetailsReview(reviewItem.review);
    setEmojiDetailsModalVisible(true);
    
    // Load missing user data for emojis if needed
    if (reviewItem.review.extra?.emojis && reviewItem.review.extra.emojis.length > 0) {
      const missingUserIds = reviewItem.review.extra.emojis
        .filter((emoji: { user_id: string }) => !users.some(u => u.id === emoji.user_id))
        .map((emoji: { user_id: string }) => emoji.user_id);
      
      if (missingUserIds.length > 0) {
        await loadMissingUsers(missingUserIds);
      }
    }
  };
  
  // Add function to load missing user data
  const loadMissingUsers = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    setIsLoadingEmojiUsers(true);
    
    try {
      const newUsers: UserModel[] = [];
      for (const userId of userIds) {
        // Skip if already loaded
        if (users.some(u => u.id === userId)) continue;
        
        const res = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
        if (res.ok) {
          const userData = (await res.json()).data;
          if (userData) {
            newUsers.push(userData);
          }
        }
      }
      
      if (newUsers.length > 0) {
        setUsers(prev => [...prev, ...newUsers]);
      }
    } catch (error) {
      console.error('Error loading emoji user data:', error);
    } finally {
      setIsLoadingEmojiUsers(false);
    }
  };

  // Check if review has any emojis
  const hasEmojis = (emojis: { user_id: string, emoji: string }[] = []) => {
    return emojis && emojis.length > 0;
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

    // Get user's emoji for this review
    const userEmoji = getUserEmoji(review.extra?.emojis || []);

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
          
          {/* Emoji count button */}
          {hasEmojis(review.extra?.emojis) && (
            <TouchableOpacity
              style={styles.emojiListButton}
              onPress={() => handleShowEmojiList(review.id)}
            >
              <Text style={styles.emojiText}>{review.extra.emojis[0].emoji}</Text>
              <Text style={styles.emojiListButtonText}>
                {review.extra?.emojis?.length || 0}
              </Text>
            </TouchableOpacity>
          )}

          {/* Emoji button */}
          <View style={styles.emojiButtonsContainer}>
            <TouchableOpacity
              style={[styles.emojiButton, userEmoji ? styles.emojiButtonActive : {}]}
              onPress={() => handleEmojiPress(review.id)}
            >
              {userEmoji ? (
                <Text style={styles.emojiText}>{userEmoji}</Text>
              ) : (
                <PlusIcon width={9} height={9} fill={Colors.primaryGray + '60'} />
              )}
            </TouchableOpacity>
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

      {/* Emoji Picker Modal */}
      <BottomModal
        visible={emojiModalVisible}
        onClose={() => setEmojiModalVisible(false)}
        title={t('reviews.emojiPicker', 'Choose a Reaction')}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiGrid}>
            {['😀', '😍', '😂', '🥰', '👍', '👏', '❤️', '🔥', '🤔', '😭'].map((emoji, index) => {
              // Check if this emoji is already selected
              const isSelected = emojiReviewId && reviews.find(
                (item: any) => item.review?.id === emojiReviewId
              )?.review?.extra?.emojis?.some(
                (e: { user_id: string, emoji: string }) => e.user_id === user?.id && e.emoji === emoji
              );

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiPickerItem,
                    isSelected ? styles.emojiPickerItemSelected : {}
                  ]}
                  onPress={() => handleSelectEmoji(emoji)}
                  disabled={isSubmittingEmoji}
                >
                  <Text style={styles.emojiPickerText}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isSubmittingEmoji && (
            <View style={styles.emojiLoadingContainer}>
              <PrettyLoadingIcon width={24} height={24} stroke={Colors.primaryGray} />
            </View>
          )}

        </View>
      </BottomModal>

      {/* Emoji Details Modal */}
      <BottomModal
        visible={emojiDetailsModalVisible}
        onClose={() => setEmojiDetailsModalVisible(false)}
        title={t('reviews.reactions', 'Reactions')}
      >
        {emojiDetailsReview && (
          <View style={styles.emojiDetailsModalContainer}>
            {/* List of users who reacted */}
            {(emojiDetailsReview.extra?.emojis?.length || 0) > 0 ? (
              <View style={styles.emojiUsersList}>
                {isLoadingEmojiUsers && (
                  <View style={styles.emojiLoadingContainer}>
                    <PrettyLoadingIcon width={24} height={24} stroke={Colors.primaryGray} />
                  </View>
                )}
                {emojiDetailsReview.extra?.emojis?.map((reaction, index) => {
                  const reactionUser = users.find(u => u.id === reaction.user_id);
                  const isCurrentUser = reaction.user_id === user?.id;
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.emojiUserItem}
                      onPress={() => navigation.navigate('UserProfile', { userId: reaction.user_id })}
                    >
                      <View style={styles.emojiUserInfo}>
                        {reactionUser?.picture ? (
                          <Image
                            source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${reactionUser.picture}` }}
                            style={styles.emojiUserImage}
                          />
                        ) : (
                          <View style={[styles.emojiUserImage, styles.emojiUserImagePlaceholder]}>
                            <PersonIcon width={14} height={14} fill={Colors.primaryGray + '88'} />
                          </View>
                        )}
                        <Text style={styles.emojiUserName} numberOfLines={1}>
                          {isCurrentUser 
                            ? `${reactionUser?.name || t('general.you', 'You')}`
                            : (reactionUser?.name || t('general.unknownUser', 'Unknown User'))}
                          {isCurrentUser && ` (${t('general.you', 'You')})`}
                        </Text>
                      </View>
                      <Text style={styles.emojiUserEmoji}>{reaction.emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noEmojisText}>
                {t('reviews.noReactions', 'No reactions yet')}
              </Text>
            )}
          </View>
        )}
      </BottomModal>
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
  emojiListButton: {
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLightGray + '40',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  emojiText: {
    fontSize: 12,
    color: Colors.primaryGray,
  },
  emojiListButtonText: {
    fontSize: 10,
    color: Colors.primaryGray,
    fontWeight: '500',
  },
  emojiButtonsContainer: {
    backgroundColor: Colors.primaryLightGray + '40',
    borderRadius: 12,
  },
  emojiButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonActive: {
    backgroundColor: Colors.primaryLightGray + '88',
  },
  emojiPickerContainer: {
    padding: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiPickerItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderRadius: 8,
  },
  emojiPickerItemSelected: {
    backgroundColor: Colors.primaryLightGray + '88',
  },
  emojiPickerText: {
    fontSize: 24,
  },
  emojiLoadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  emojiNoteContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emojiNote: {
    fontSize: 12,
    color: Colors.primaryGray + '88',
    fontStyle: 'italic',
  },
  emojiDetailsModalContainer: {
    padding: 16,
  },
  emojiUsersList: {
    marginTop: 5,
  },
  emojiUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
  },
  emojiUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiUserImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: Colors.primaryLightGray,
  },
  emojiUserImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiUserName: {
    fontSize: 13,
    color: Colors.primaryGray,
    flex: 1,
  },
  emojiUserEmoji: {
    fontSize: 16,
    marginLeft: 8,
  },
  noEmojisText: {
    fontSize: 13,
    color: Colors.primaryGray + '88',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default RelevantReviewsScreen;