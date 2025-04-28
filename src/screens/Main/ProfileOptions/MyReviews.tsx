import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Categories, Colors, Locations } from '../../../utils/Constants';
import { FeatherPenIcon, PlusIcon, PrettyLoadingIcon, ThumbsUpIcon, TranslateIcon, EllipsisIcon, TrashIcon, PersonIcon, BlockIcon } from '../../../utils/Svgs';
import { Config } from '../../../utils/Config';
import { PrettyButton, BottomModal, OptionItem } from '../../../components';
import { ReviewModel, UserModel } from '../../../utils/Interfaces';
import { getTimeFromNow } from '../../../utils/Functions';
import { MarkdownText } from '../../../components';
import { useAppState } from '../../../contexts/AppContext';

const MyReviewsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { t } = useTranslation();
  const { user, locale, setUser } = useAppState();
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [translatedReviews, setTranslatedReviews] = useState<Record<string, string>>({});
  const [showingTranslations, setShowingTranslations] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewModel | null>(null);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likeUsers, setLikeUsers] = useState<UserModel[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // Load user and their reviews
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      await loadInitialData();
    })();
  }, [user?.id]);

  const loadInitialData = async () => {
    try {
      // Load reviews
      const reviewsData = await loadReviews(0);
      setReviews(reviewsData.sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasMoreReviews || isLoadingMore || !user?.id) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const newReviews = await loadReviews(nextPage);

      if (newReviews.length > 0) {
        setReviews(prev => [...prev, ...newReviews].sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
        setPage(nextPage);
        setHasMoreReviews(newReviews.length === limit);
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadReviews = async (page: number) => {
    const res = await fetch(`${Config.api.url}/data?table=reviews&query=user_id:${user?.id}&limit=${limit}&offset=${page * limit}&sortBy=created_at&order=desc`);
    const data = await res.json();
    return data.data;
  }

  // Close the modal
  const handleClose = () => {
    navigation.goBack();
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

  const handleShowLikes = async (review: ReviewModel) => {
    setSelectedReview(review);
    setLikesModalVisible(true);
    setLoadingLikes(true);
    
    try {
      // If no likes, don't fetch
      if (!review.extra.likes || review.extra.likes.length === 0) {
        setLikeUsers([]);
        setLoadingLikes(false);
        return;
      }
      
      // Fetch user data for each like
      const userPromises = review.extra.likes.map(async (userId: string) => {
        const response = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.data || null;
      });
      
      const userData = await Promise.all(userPromises);
      setLikeUsers(userData.filter(Boolean)); // Filter out any null results
    } catch (error) {
      console.error('Error fetching like users:', error);
      Alert.alert(t('error.title', 'Error'), t('error.fetchingUsers', 'There was an error fetching user data.'));
    } finally {
      setLoadingLikes(false);
    }
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
      const targetLang = locale === 'zh' ? 'zh-TW' : 'en';

      // Make the translation request
      const response = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: content,
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

  const handleOptionPress = (review: ReviewModel) => {
    setSelectedReview(review);
    setOptionsModalVisible(true);
  };

  const handleEditReview = () => {
    if (!selectedReview) return;
    
    setOptionsModalVisible(false);
    navigation.navigate('EditReview', { reviewId: selectedReview.id, onDone: (review: ReviewModel | undefined) => {
      if (!review) return;
      setReviews(prev => prev.map(r => r.id === review.id ? review : r));
    } });
  };

  const handleDeleteReview = () => {
    if (!selectedReview) return;
    
    Alert.alert(
      t('profile.myReviews.deleteReviewTitle'),
      t('profile.myReviews.deleteReviewMessage').replace('{{title}}', selectedReview.title),
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const reviewId = selectedReview.id;
              await fetch(`${Config.api.url}/data?table=reviews&id=${reviewId}`, {
                method: 'DELETE',
              });
              
              // Remove from local state
              setReviews(prev => prev.filter(review => review.id !== reviewId));
              setOptionsModalVisible(false);
            } catch (error) {
              console.error('Error deleting review:', error);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async () => {
    if (!selectedReview || !user) return;
    
    const userToBlock = selectedReview.user_id;
    
    Alert.alert(
      t('profile.blockUser.title', 'Block User'),
      t('profile.blockUser.message', 'Are you sure you want to block this user? You will no longer see their posts.'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('general.block', 'Block'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Update local state
              const blockedUsers = user.settings?.blocked_users || [];
              if (!blockedUsers.includes(userToBlock)) {
                const updatedBlockedUsers = [...blockedUsers, userToBlock];
                const updatedSettings = {
                  ...user.settings,
                  blocked_users: updatedBlockedUsers
                };
                
                // Update on server
                await fetch(`${Config.api.url}/data?table=users&id=${user.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ settings: updatedSettings })
                });
                
                // Update context
                const updatedUser = {
                  ...user,
                  settings: updatedSettings
                };
                
                // Update the user in the AppContext
                setUser(updatedUser);
                
                // Close modal and remove the review from the list
                setOptionsModalVisible(false);
                setReviews(prev => prev.filter(review => review.user_id !== userToBlock));
              }
            } catch (error) {
              console.error('Error blocking user:', error);
            }
          },
        },
      ]
    );
  };

  const renderReviewItem = ({ item }: { item: ReviewModel }) => {
    if (!user) return null;

    const isShowingTranslation = showingTranslations[item.id] || false;
    const isCurrentlyTranslating = isTranslating[item.id] || false;
    const isCurrentUserReview = user.id === item.user_id;
    
    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation ? translatedReviews[item.id] : item.content;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.locationText}>{Locations.nsysu.find(l => l.id === item.location)?.[locale === 'zh' ? 'name' : 'name_en']}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.reviewDate}>{getTimeFromNow(item.created_at)}</Text>
            <PrettyButton 
              style={styles.optionsButton} 
              onPress={() => handleOptionPress(item)}
            >
              <EllipsisIcon width={24} height={24} />
            </PrettyButton>
          </View>
        </View>

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
          <PrettyButton 
            style={[
              styles.likesContainer, 
              { backgroundColor: Colors.secondaryGray }
            ]} 
            onPress={() => handleShowLikes(item)}
            contentStyle={{ gap: 6 }}
          >
            <ThumbsUpIcon 
              width={16} 
              height={16} 
              fill={Colors.primaryGray} 
            />
            <Text style={[
              styles.likesText, 
              { color: Colors.primaryGray }
            ]}>
              {item.extra.likes.length}
            </Text>
          </PrettyButton>
        </View>
      </View>
    );
  };

  const renderLikeUserItem = ({ item }: { item: UserModel }) => {
    return (
      <TouchableOpacity 
        style={styles.likeUserItem}
        onPress={() => {
          setLikesModalVisible(false);
          navigation.navigate('UserProfile', { userId: item.id });
        }}
      >
        {item?.picture ? (
          <Image
            source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${item.picture}` }}
            style={styles.likeUserImage}
          />
        ) : (
          <View style={styles.likeUserPlaceholder}>
            <View style={{ paddingTop: 4 }}>
              <PersonIcon width={24} height={24} fill={Colors.primaryGray + '44'} />
            </View>
          </View>
        )}
        <Text style={styles.likeUserName}>{item.name}</Text>
      </TouchableOpacity>
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.myReviews.title', 'My Reviews')}</Text>
          <PrettyButton
            style={styles.closeButton}
            onPress={handleClose}
            contentStyle={{ gap: 0 }}
          >
            <View style={{ transform: [{ rotate: '45deg' }], width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <PlusIcon width={14} height={14} />
            </View>
          </PrettyButton>
        </View>

        {/* Use FlatList with ListHeaderComponent instead of nested ScrollView */}
        <FlatList
          data={reviews}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <Text style={[styles.emptyText, styles.section]}>{t('profile.myReviews.noReviews')}</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreReviews}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContainer}
        />

        {/* Options Modal */}
        <BottomModal
          visible={optionsModalVisible}
          onClose={() => setOptionsModalVisible(false)}
          title={t('profile.myReviews.options')}
        >
          {selectedReview && user && user.id === selectedReview.user_id ? (
            // Current user's post options
            <>
              <OptionItem
                label={t('profile.myReviews.editReview')}
                labelStyle={{ fontWeight: '600' }}
                onPress={handleEditReview}
                icon={<FeatherPenIcon width={20} height={20} fill={Colors.primary} />}
              />
              <OptionItem
                label={t('profile.myReviews.deleteReview')}
                labelStyle={{ fontWeight: '600' }}
                onPress={handleDeleteReview}
                icon={<TrashIcon width={20} height={20} fill="#FF3B30" />}
                destructive
              />
            </>
          ) : (
            // Other user's post options
            <OptionItem
              label={t('profile.blockUser.blockUser', 'Block User')}
              labelStyle={{ fontWeight: '600' }}
              onPress={handleBlockUser}
              icon={<BlockIcon width={20} height={20} fill="#FF3B30" />}
              destructive
            />
          )}
        </BottomModal>

        {/* Likes Modal */}
        <BottomModal
          visible={likesModalVisible}
          onClose={() => setLikesModalVisible(false)}
          title={t('profile.myReviews.likes', 'Likes')}
        >
          {loadingLikes ? (
            <View style={styles.likesLoadingContainer}>
              <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
            </View>
          ) : likeUsers.length > 0 ? (
            <FlatList
              data={likeUsers}
              removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
              keyExtractor={(item) => item.id}
              renderItem={renderLikeUserItem}
              style={styles.likeUsersList}
            />
          ) : (
            <Text style={styles.noLikesText}>{t('profile.myReviews.noLikes', 'No likes yet.')}</Text>
          )}
        </BottomModal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
    marginTop: -2,
  },
  scrollContent: {
    flex: 1,
    gap: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  profileImageContainer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 50,
    marginBottom: 12,
  },
  profilePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userInfoContainer: {
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: Colors.primaryGray + '80',
    marginTop: 4,
  },
  userInfoButton: {
    paddingHorizontal: 15,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#f3f3f300',
    borderWidth: 1.5,
    borderColor: Colors.primaryGray + '40',
  },
  userInfoButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 14,
    color: Colors.primaryGray,
    lineHeight: 20,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  card: {
    marginVertical: 0,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
    aspectRatio: 3 / 1,
    backgroundColor: Colors.secondaryGray,
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    width: '25%',
    aspectRatio: 1 / 1,
    right: 10,
    bottom: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryGray,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#777',
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: Colors.primaryGray,
  },
  reviewItem: {
    paddingVertical: 16,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLightGray,
  },
  reviewDate: {
    fontSize: 14,
    color: '#aaa',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  anonymousText: {
    fontSize: 12,
    color: '#aaa',
    marginVertical: 8,
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
    backgroundColor: Colors.secondaryGray,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 2,
  },
  likesText: {
    fontSize: 12,
    color: Colors.primaryGray,
  },
  locationText: {
    fontSize: 14,
    color: '#888',
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
  translateButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  translateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    padding: 0,
  },
  // Likes modal styles
  likesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeUsersList: {
    maxHeight: 300,
    paddingBottom: 20,
  },
  likeUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
  },
  likeUserImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 16,
  },
  likeUserPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  likeUserName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  noLikesText: {
    padding: 40,
    textAlign: 'center',
    color: '#aaa',
  },
  reportContainer: {
    padding: 20,
  },
  reportMessage: {
    fontSize: 16,
    color: Colors.primaryGray,
    marginBottom: 20,
  },
  selectedReportOption: {
    backgroundColor: Colors.primaryLightGray + '40',
  },
  reportButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyReviewsScreen; 