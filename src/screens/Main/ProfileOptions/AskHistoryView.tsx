import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView, Platform, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ReviewModel } from '../../../utils/Interfaces';
import { Config } from '../../../utils/Config';
import { Colors } from '../../../utils/Constants';
import { PlusIcon, PrettyLoadingIcon, SendIcon, ChevronDownIcon } from '../../../utils/Svgs';
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
        if (!reviewData?.id) continue;

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
        <PrettyButton
          style={[styles.headerButton, { alignItems: 'flex-start' }]}
          onPress={handleClose}
        >
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <ChevronDownIcon width={20} height={20} />
          </View>
        </PrettyButton>
        <Text style={styles.headerTitle}>{t('profile.askHistory.viewTitle', 'Ask History')}</Text>
        <View style={styles.headerButton} />
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
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
    width: '100%',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
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