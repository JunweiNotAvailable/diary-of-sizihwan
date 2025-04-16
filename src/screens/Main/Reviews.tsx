import { View, Text, FlatList, StyleSheet, Image, Alert, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import { Colors, Categories } from '../../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import PrettyButton from '../../components/PrettyButton';
import { ChevronDownIcon, PersonIcon, PlusIcon, PrettyLoadingIcon, ThumbsUpIcon } from '../../utils/Svgs';
import { getTimeFromNow } from '../../utils/Functions';
import { Config } from '../../utils/Config';

// Function to parse and render markdown in text
const parseMarkdown = (text: string) => {
  if (!text) return [];

  // Define regex patterns for different markdown styles
  const patterns = [
    { pattern: /\*\*\*(.*?)\*\*\*/g, style: styles.boldItalic },
    { pattern: /\*\*(.*?)\*\*/g, style: styles.bold },
    { pattern: /\*(.*?)\*/g, style: styles.italic },
    { pattern: /_(.*?)_/g, style: styles.underscore },
    { pattern: /-(.*?)-/g, style: styles.strikethrough }
  ];

  // Initialize result with the original text
  let segments: { text: string; style?: any }[] = [{ text }];

  // Process each pattern
  patterns.forEach(({ pattern, style }) => {
    const newSegments: { text: string; style?: any }[] = [];

    // Process each existing segment
    segments.forEach(segment => {
      // Skip already styled segments
      if (segment.style) {
        newSegments.push(segment);
        return;
      }

      let lastIndex = 0;
      const matches = segment.text.matchAll(pattern);
      let match = matches.next();

      // No matches in this segment
      if (match.done) {
        newSegments.push(segment);
        return;
      }

      // Process matches in this segment
      while (!match.done) {
        const m = match.value;
        const [fullMatch, content] = m;
        const startIndex = m.index!;
        const endIndex = startIndex + fullMatch.length;

        // Add text before the match
        if (startIndex > lastIndex) {
          newSegments.push({
            text: segment.text.substring(lastIndex, startIndex)
          });
        }

        // Add the styled text
        newSegments.push({
          text: content,
          style
        });

        lastIndex = endIndex;
        match = matches.next();
      }

      // Add remaining text after the last match
      if (lastIndex < segment.text.length) {
        newSegments.push({
          text: segment.text.substring(lastIndex)
        });
      }
    });

    segments = newSegments;
  });

  return segments;
};

// Component to render markdown text
const MarkdownText = ({ children, style, numberOfLines }: { children: string; style?: any; numberOfLines?: number }) => {
  const parsedText = parseMarkdown(children);

  return (
    <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {parsedText.map((part, index) => (
        <Text key={index} style={part.style}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

const ReviewsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const location = route.params?.location;
  const { user, locale } = useAppState();
  const { t } = useTranslation();
  // pagination
  const [page, setPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 20;

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
      // Get reviews
      const newReviews = await loadReviews(location.id, 0);
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
  const loadReviews = async (locationId: string, page: number) => {
    const res = await fetch(`${Config.api.url}/data?table=reviews&query=location:${locationId}&limit=${limit}&offset=${page * limit}`);
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
  
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {(!item.extra.is_anonymous && user.picture) ? (
              <Image
                source={{ uri: user.picture }}
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
          <Text style={styles.reviewDate}>{getTimeFromNow(item.created_at)}</Text>
        </View>

        <Text style={styles.reviewTitle}>{item.title}</Text>
        <MarkdownText 
          style={styles.reviewContent}
        >
          {item.content}
        </MarkdownText>

        <View style={styles.bottomContainer}>
          {/* categories */}
          <View style={styles.categoriesContainer}>
            {item.categories.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{t(`categories.${category}`)}</Text>
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
        {/* back button */}
        <PrettyButton
          style={[styles.headerButton, { alignItems: 'flex-start' }]}
          onPress={() => navigation.goBack()}
        >
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <ChevronDownIcon width={20} height={20} stroke={Colors.primary} />
          </View>
        </PrettyButton>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} ellipsizeMode="middle" numberOfLines={1}>
            {locale === 'zh' ? location.name : location.name_en}
          </Text>
        </View>
        {/* Add new review button */}
        <PrettyButton
          style={styles.headerButton}
          onPress={() => navigation.navigate('New', { locationId: location.id })}
          children={<PlusIcon width={15} height={15} stroke={Colors.primary} />}
        />
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
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
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  reviewContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 6,
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
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
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
    marginBottom: 8,
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

export default ReviewsScreen;