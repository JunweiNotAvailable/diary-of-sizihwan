import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Categories, Colors, Locations } from '../../utils/Constants';
import { AskIcon, EllipsisIcon, FeatherPenIcon, PersonIcon, PlusIcon, PrettyLoadingIcon, SettingsIcon, ThumbsUpIcon, TrashIcon, TranslateIcon, FlagIcon, BlockIcon, ChevronDownIcon } from '../../utils/Svgs';
import { Config } from '../../utils/Config';
import { Popup, PrettyButton, BottomModal, OptionItem } from '../../components';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { getTimeFromNow } from '../../utils/Functions';
import { MarkdownText } from '../../components';
import { useAppState } from '../../contexts/AppContext';

const UserProfileScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { userId } = route.params;
  const { t } = useTranslation();
  const { locale, user: currentUser, setUser } = useAppState();
  const [user, setProfileUser] = useState<UserModel | null>(null);
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
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  // Options modals
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewModel | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Load user and their reviews
  useEffect(() => {
    if (!userId) return;

    (async () => {
      await loadInitialData();
    })();
  }, [userId]);

  const loadInitialData = async () => {
    try {
      // Load user
      const res = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
      const userData = (await res.json()).data;
      setProfileUser(userData);

      // Load reviews
      // Get reviews
      const newReviews = await loadReviews(userId, 0);
      setReviews(newReviews.sort((a: ReviewModel, b: ReviewModel) => a.created_at > b.created_at ? -1 : 1));
      setPage(0);
      setHasMoreReviews(newReviews.length === limit);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasMoreReviews || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const newReviews = await loadReviews(userId, nextPage);

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

  const loadReviews = async (userId: string, page: number) => {
    const res = await fetch(`${Config.api.url}/data?table=reviews&query=user_id:${userId}&limit=${limit}&offset=${page * limit}&sortBy=created_at&order=desc`);
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
    if (!selectedReview || !currentUser) return;
    
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
              const blockedUsers = currentUser.settings?.blocked_users || [];
              if (!blockedUsers.includes(userToBlock)) {
                const updatedBlockedUsers = [...blockedUsers, userToBlock];
                const updatedSettings = {
                  ...currentUser.settings,
                  blocked_users: updatedBlockedUsers
                };
                
                // Update on server
                await fetch(`${Config.api.url}/data?table=users&id=${currentUser.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ settings: updatedSettings })
                });
                
                // Update context
                const updatedUser = {
                  ...currentUser,
                  settings: updatedSettings
                };
                
                // Update the user in the AppContext
                setUser(updatedUser);
                
                // Close modal and go back
                setOptionsModalVisible(false);
                navigation.goBack();
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
    if (!selectedReview || !currentUser || !reportReason) return;
    
    setIsSubmittingReport(true);
    
    try {
      // Simulate API call to submit the report
      // In a real implementation, you would submit to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Format message with report details
      const messageContent = `
Report Information:
------------------
Review ID: ${selectedReview.id}
Review Title: ${selectedReview.title}
Posted by: User ID ${selectedReview.user_id}

Reported by: User ID ${currentUser.id} (${currentUser.name})
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

  const renderReviewItem = ({ item }: { item: ReviewModel }) => {
    if (!user) return null;

    const isExpanded = expandedReviews[item.id] || false;
    const isShowingTranslation = showingTranslations[item.id] || false;
    const isCurrentlyTranslating = isTranslating[item.id] || false;
    const hasTranslation = !!translatedReviews[item.id];
    const isCurrentUserReview = currentUser?.id === item.user_id;

    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation ? translatedReviews[item.id] : item.content;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.locationText}>{Locations.nsysu.find(l => l.id === item.location)?.[locale === 'zh' ? 'name' : 'name_en']}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.reviewDate}>{getTimeFromNow(item.created_at)}</Text>
            {currentUser && (
              <PrettyButton 
                style={styles.optionsButton} 
                onPress={() => handleOptionPress(item)}
              >
                <EllipsisIcon width={24} height={24} />
              </PrettyButton>
            )}
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

  // Profile header component that will be rendered at the top of the FlatList
  const renderProfileHeader = () => {
    return (
      <>
        {/* Profile picture and name */}
        <View style={styles.profileImageContainer}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user?.name || ''}</Text>
            {/* Score */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{t('userProfile.score', '{{name}} 的回顧被引用了 {{count}} 次').replace('{{name}}', user?.name || '').replace('{{count}}', String(reviews.reduce((acc, review) => acc + (review.extra?.score || 0), 0) || 0))}</Text>
                <TouchableOpacity
                  style={styles.questionMarkButton}
                  onPress={() => setShowScoreInfo(true)}
                >
                  <Text style={styles.questionMarkText}>!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {user?.picture ? (
            <Image
              source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${user.picture}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <View style={{ width: 48, height: 48, marginTop: 8 }}>
                <PersonIcon width={48} height={48} fill={Colors.primaryGray + '44'} />
              </View>
            </View>
          )}
        </View>

        {/* Bio */}
        {user?.extra?.bio && (
          <View style={styles.section}>
            <Text style={styles.paragraph}>{user.extra.bio}</Text>
          </View>
        )}

        {/* Reviews header */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('userProfile.reviews').replace('{{name}}', user?.name || '')}</Text>
          <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.primaryLightGray }} />
        </View>
      </>
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
        {/* Header with back button */}
        <View style={styles.header}>
          <PrettyButton
            style={[styles.headerButton, { alignItems: 'flex-start' }]}
            onPress={handleClose}
          >
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronDownIcon width={20} height={20} />
            </View>
          </PrettyButton>
          <Text style={styles.headerTitle}>{t('userProfile.title', 'Profile')}</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Use FlatList with ListHeaderComponent instead of nested ScrollView */}
        <FlatList
          data={reviews}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          ListHeaderComponent={renderProfileHeader}
          ListEmptyComponent={
            <Text style={[styles.emptyText, styles.section]}>{t('userProfile.noReviews')}</Text>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreReviews}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Score Info Popup */}
      <Popup
        visible={showScoreInfo}
        onClose={() => setShowScoreInfo(false)}
        title={t('profile.scoreInfo.title', 'How Scores Work')}
        content={t('profile.scoreInfo.content')}
      />
      
      {/* Options Modal */}
      <BottomModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        title={t('profile.myReviews.options', 'Options')}
      >
        {selectedReview && currentUser?.id === selectedReview.user_id ? (
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
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: '#eee',
    width: '100%',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
    borderRadius: 24,
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
    alignItems: 'stretch',
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionMarkButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryGray + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryGray,
  },
  optionsButton: {
    height: 24,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    padding: 0,
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

export default UserProfileScreen; 