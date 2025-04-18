import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView, Platform, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ReviewModel } from '../../../utils/Interfaces';
import { Config } from '../../../utils/Config';
import { Colors } from '../../../utils/Constants';
import { PlusIcon, PrettyLoadingIcon, SendIcon } from '../../../utils/Svgs';
import { PrettyButton } from '../../../components';
import { t } from 'i18next';

const AskHistoryView = ({ navigation, route }: { navigation: any, route: any }) => {
  const { ask } = route.params;
  const [referencedReviews, setReferencedReviews] = useState<{ review: ReviewModel, score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ask) return;

    (async () => {
      const newReferencedReviews: { review: ReviewModel, score: number }[] = [];
      for (const review of ask.referenced_reviews) {
        const res = await fetch(`${Config.api.url}/data?table=reviews&id=${review.id}`);
        const reviewData = (await res.json()).data;
        newReferencedReviews.push({ review: reviewData, score: review.score });
      }
      setReferencedReviews(newReferencedReviews);
      setIsLoading(false);
    })();
  }, [ask]);

  if (isLoading) return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
      </View>
    </View>
  );

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.askHistory.viewTitle', 'Ask History')}</Text>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* Chat body */}
          <ScrollView
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{ask.question}</Text>
            </View>

            {/* Animated Response Text */}
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{ask.response}</Text>
            </View>

            {/* Relevant reviews button */}
            {(referencedReviews.length > 0) && <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <PrettyButton
                style={styles.relevantReviewsButton}
                onPress={() => navigation.navigate('RelevantReviews', { reviews: referencedReviews })}
              >
                <Text style={styles.relevantReviewsText}>{t('ask.relevantReviews', 'Relevant reviews')}</Text>
              </PrettyButton>
            </View>}
          </ScrollView>
        </TouchableWithoutFeedback>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  chatContent: {
    flexGrow: 1,
    gap: 10,
  },
  questionContainer: {
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 20,
  },
  statusText: {
    color: '#aaa',
    fontSize: 16,
  },
  messageContainer: {
    padding: 12,
    paddingBottom: 16,
    position: 'relative',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  cursorContainer: {
    position: 'absolute',
    bottom: 16,
    marginLeft: 3,
    height: 20,
    justifyContent: 'center',
  },
  cursor: {
    fontSize: 16,
    fontWeight: '300',
    opacity: 0.2,
  },
  relevantReviewsButton: {
    height: 30,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f3f3f3',
  },
  relevantReviewsText: {
    fontSize: 12,
    color: '#888',
  },
});

export default AskHistoryView