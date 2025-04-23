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
import { AskIcon, FeatherPenIcon, PersonIcon, PlusIcon, PrettyLoadingIcon, SettingsIcon, ThumbsUpIcon, TranslateIcon } from '../../utils/Svgs';
import { Config } from '../../utils/Config';
import { Popup, PrettyButton } from '../../components';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { getTimeFromNow } from '../../utils/Functions';
import { MarkdownText } from '../../components';
import { useAppState } from '../../contexts/AppContext';

const UserProfileScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { userId } = route.params;
  const { t } = useTranslation();
  const { locale } = useAppState();
  const [user, setUser] = useState<UserModel | null>(null);
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
      setUser(userData);

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

  const renderReviewItem = ({ item }: { item: ReviewModel }) => {
    if (!user) return null;

    const isExpanded = expandedReviews[item.id] || false;
    const isShowingTranslation = showingTranslations[item.id] || false;
    const isCurrentlyTranslating = isTranslating[item.id] || false;
    const hasTranslation = !!translatedReviews[item.id];

    // Determine which content to show (original or translated)
    const displayContent = isShowingTranslation ? translatedReviews[item.id] : item.content;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.locationText}>{Locations.nsysu.find(l => l.id === item.location)?.[locale === 'zh' ? 'name' : 'name_en']}</Text>
          <Text style={styles.reviewDate}>{getTimeFromNow(item.created_at)}</Text>
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
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('userProfile.title', 'Profile')}</Text>
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
});

export default UserProfileScreen; 