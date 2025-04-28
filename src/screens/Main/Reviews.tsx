import { View, Text, FlatList, StyleSheet, Image, Alert, SafeAreaView, TouchableWithoutFeedback, TouchableOpacity, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { Colors, Categories, Locations } from '../../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import PrettyButton from '../../components/PrettyButton';
import { CheckIcon, ChevronDownIcon, EllipsisIcon, FeatherPenIcon, PersonIcon, PlusIcon, PrettyLoadingIcon, ThumbsUpIcon, TrashIcon, TranslateIcon, BlockIcon, FlagIcon } from '../../utils/Svgs';
import { getTimeFromNow } from '../../utils/Functions';
import { Config } from '../../utils/Config';
import { MarkdownText, BottomModal, OptionItem } from '../../components';

const ReviewsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [translatedReviews, setTranslatedReviews] = useState<Record<string, string>>({});
  const [showingTranslations, setShowingTranslations] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [location, setLocation] = useState(route.params?.location);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const { user, locale, setUser } = useAppState();
  const { t } = useTranslation();
  // pagination
  const [page, setPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 20;
  // Options modal
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewModel | null>(null);
  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    // Check if location parameter is provided
    if (!location) {
      setError(t('reviews.errors.locationRequired'));
      setIsLoading(false);
      return;
    }

    // Fetch reviews and users from database
    (async () => {
      await loadInitialData();
    })();
  }, [location]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Get reviews
      const newReviews = await loadReviews(location.id, 0);
      
      // Filter out reviews from blocked users
      const filteredReviews = user?.settings?.blocked_users 
        ? newReviews.filter((review: ReviewModel) => !user.settings?.blocked_users?.includes(review.user_id))
        : newReviews;
      
      setReviews(filteredReviews.sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
      setPage(0);
      setHasMoreReviews(newReviews.length === limit);

      // Get users
      await loadMoreUsers(filteredReviews.map((review: ReviewModel) => review.user_id));
    } catch (error) {
      setError(t('reviews.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load reviews
  const loadReviews = async (locationId: string, page: number) => {
    const res = await fetch(`${Config.api.url}/data?table=reviews&query=location:${locationId}&limit=${limit}&offset=${page * limit}&sortBy=created_at&order=desc`);
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
      const newReviews = await loadReviews(location.id, nextPage);

      if (newReviews.length > 0) {
        // Filter out reviews from blocked users
        const filteredReviews = user?.settings?.blocked_users 
          ? newReviews.filter((review: ReviewModel) => !user.settings?.blocked_users?.includes(review.user_id))
          : newReviews;
        
        setReviews(prev => [...prev, ...filteredReviews].sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
        setPage(nextPage);
        setHasMoreReviews(newReviews.length === limit);

        // Load users for new reviews
        await loadMoreUsers(filteredReviews.map((review: ReviewModel) => review.user_id));
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

  const handleChangeLocation = (newLocation: any) => {
    setLocation(newLocation);
    setLocationModalVisible(false);
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
                
                // Close modal and remove the blocked user's reviews from the list
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

  const handleReportReview = () => {
    if (!selectedReview) return;
    
    setOptionsModalVisible(false);
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!selectedReview || !user || !reportReason) return;
    
    setIsSubmittingReport(true);
    
    try {
      // Format message with report details
      const messageContent = `
Report Information:
------------------
Review ID: ${selectedReview.id}
Review Title: ${selectedReview.title}
Posted by: User ID ${selectedReview.user_id}

Reported by: User ID ${user.id} (${user.name})
Reason: ${reportReason}
Date Reported: ${new Date().toISOString()}
      `;
      
      // Send email report
      await fetch(`${Config.api.url}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: "junwnotavailable@gmail.com", 
          subject: "Post Report", 
          message: messageContent
        })
      });
      
      // Close the report modal
      setReportModalVisible(false);
      setReportReason('');
      
      // Show success message
      Alert.alert(
        t('reviews.report.reportSent'),
        t('reviews.report.reportSentMessage')
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      
      // Show error message
      Alert.alert(
        t('reviews.report.reportFailed'),
        t('reviews.report.reportFailedMessage')
      );
    } finally {
      setIsSubmittingReport(false);
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
    const postUser = users.find((u: UserModel) => u.id === item.user_id);
    if (!postUser) return null;

    const isShowingTranslation = showingTranslations[item.id] || false;
    const isCurrentlyTranslating = isTranslating[item.id] || false;
    const hasTranslation = !!translatedReviews[item.id];
    const isCurrentUserPost = user?.id === item.user_id;

    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation ? translatedReviews[item.id] : item.content;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <TouchableWithoutFeedback onPress={() => navigation.navigate('UserProfile', { userId: postUser.id })}>
            <View style={styles.userInfo}>
              {(postUser.picture) ? (
                <Image
                  source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${postUser.picture}` }}
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
                  {postUser.name}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
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
          <PrettyButton style={styles.likesContainer} onPress={async () => await toggleLike(item)}>
            <ThumbsUpIcon width={24} height={24} fill={item.extra.likes.includes(user?.id || '') ? Colors.like : Colors.primaryGray + '88'} />
            <Text style={[styles.likesText, { color: item.extra.likes.includes(user?.id || '') ? Colors.like : Colors.primaryGray + '88' }]}>{item.extra.likes.length}</Text>
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

  const renderLocationItem = ({ item }: { item: any }) => {
    const isSelected = item.id === location?.id;

    return (
      <TouchableOpacity
        style={[
          styles.locationItem,
          isSelected && styles.selectedLocationItem
        ]}
        onPress={() => handleChangeLocation(item)}
      >
        <Text style={[
          styles.locationItemText,
          isSelected && styles.selectedLocationItemText
        ]}>
          {locale === 'zh' ? item.name : item.name_en}
        </Text>
        {isSelected && (
          <View style={styles.selectedLocationIndicator}>
            <CheckIcon width={10} height={10} stroke={'#fff'} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.locationHeader}>
        {/* back button */}
        <PrettyButton
          style={[styles.headerButton, { alignItems: 'flex-start' }]}
          onPress={() => navigation.goBack()}
        >
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <ChevronDownIcon width={20} height={20} />
          </View>
        </PrettyButton>
        {/* Title */}
        <TouchableOpacity
          style={styles.titleContainer}
          onPress={() => setLocationModalVisible(true)}
        >
          <View style={styles.titleWrapper}>
            <Text style={styles.title} ellipsizeMode="middle" numberOfLines={1}>
              {locale === 'zh' ? location.name : location.name_en}
            </Text>
            <ChevronDownIcon width={12} height={12} fill={Colors.primaryGray} />
          </View>
        </TouchableOpacity>
        {/* Add new review button */}
        <PrettyButton
          style={styles.headerButton}
          onPress={() => navigation.navigate('New', {
            locationId: location.id, onDone: (review: ReviewModel | undefined) => {
              if (!review || location.id !== review.location) return;
              setReviews(prev => [review, ...prev]);
            }
          })}
          children={<PlusIcon width={15} height={15} />}
        />
      </View>

      <FlatList
        data={reviews}
        removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
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

      {/* Location Selection Modal */}
      <BottomModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        title={t('new.location', 'Location')}
      >
        <FlatList
          data={Locations.nsysu}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          style={styles.locationsList}
          contentContainerStyle={styles.locationsListContent}
        />
      </BottomModal>
      
      {/* Options Modal */}
      <BottomModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        title={t('profile.myReviews.options', 'Options')}
      >
        {selectedReview && user && user.id === selectedReview.user_id ? (
          // Current user's post options
          <>
            <OptionItem
              label={t('profile.myReviews.editReview', 'Edit')}
              labelStyle={{ fontWeight: '600' }}
              onPress={handleEditReview}
              icon={<FeatherPenIcon width={20} height={20} fill={Colors.primary} />}
            />
            <OptionItem
              label={t('profile.myReviews.deleteReview', 'Delete')}
              labelStyle={{ fontWeight: '600' }}
              onPress={handleDeleteReview}
              icon={<TrashIcon width={20} height={20} fill="#FF3B30" />}
              destructive
            />
          </>
        ) : (
          // Other user's post options
          <>
            <OptionItem
              label={t('reviews.report.title', 'Report Review')}
              labelStyle={{ fontWeight: '600' }}
              onPress={handleReportReview}
              icon={<FlagIcon width={20} height={20} />}
            />
            <OptionItem
              label={t('profile.blockUser.blockUser', 'Block User')}
              labelStyle={{ fontWeight: '600' }}
              onPress={handleBlockUser}
              icon={<BlockIcon width={20} height={20} fill="#FF3B30" />}
              destructive
            />
          </>
        )}
      </BottomModal>

      {/* Report Review Modal */}
      <BottomModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        title={t('reviews.report.title', 'Report Review')}
      >
        <View style={styles.reportContainer}>
          <Text style={styles.reportMessage}>{t('reviews.report.message')}</Text>
          
          <OptionItem
            label={t('reviews.report.options.inappropriate')}
            onPress={() => setReportReason('inappropriate')}
            style={reportReason === 'inappropriate' ? styles.selectedReportOption : {}}
          />
          
          <OptionItem
            label={t('reviews.report.options.spam')}
            onPress={() => setReportReason('spam')}
            style={reportReason === 'spam' ? styles.selectedReportOption : {}}
          />
          
          <OptionItem
            label={t('reviews.report.options.offensive')}
            onPress={() => setReportReason('offensive')}
            style={reportReason === 'offensive' ? styles.selectedReportOption : {}}
          />
          
          <OptionItem
            label={t('reviews.report.options.other')}
            onPress={() => setReportReason('other')}
            style={reportReason === 'other' ? styles.selectedReportOption : {}}
          />
          
          <View style={styles.reportButtonContainer}>
            <PrettyButton
              onPress={submitReport}
              style={styles.reportButton}
              disabled={!reportReason || isSubmittingReport}
            >
              {isSubmittingReport ? (
                <PrettyLoadingIcon width={24} height={24} stroke="#fff" />
              ) : (
                <Text style={styles.reportButtonText}>{t('reviews.report.submitReport')}</Text>
              )}
            </PrettyButton>
          </View>
        </View>
      </BottomModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // padding: 16,
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
  titleContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reviewsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  reviewItem: {
    paddingVertical: 16,
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
  // Location modal styles
  locationsList: {
    maxHeight: 400,
  },
  locationsListContent: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
  },
  selectedLocationItem: {
    backgroundColor: Colors.secondaryGray,
  },
  locationItemText: {
    fontSize: 16,
    fontWeight: '300',
  },
  selectedLocationItemText: {
    fontWeight: '600',
  },
  selectedLocationIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    padding: 0,
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
  // Report styles
  reportContainer: {
    padding: 20,
  },
  reportMessage: {
    fontSize: 16,
    color: Colors.primaryGray,
    marginBottom: 20,
  },
  selectedReportOption: {
    backgroundColor: Colors.primaryLightGray + '80',
  },
  reportButtonContainer: {
    marginTop: 20,
  },
  reportButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewsScreen;