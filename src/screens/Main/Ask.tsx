import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Colors } from '../../utils/Constants'
import { Config } from '../../utils/Config'
import { Input, PrettyButton } from '../../components'
import { t } from 'i18next'
import { PlusIcon, PrettyLoadingIcon, SendIcon } from '../../utils/Svgs'
import { AskModel, ReviewModel } from '../../utils/Interfaces'
import { generateRandomString, getSystemPrompt } from '../../utils/Functions'
import { useAppState } from '../../contexts/AppContext'

const AskScreen = ({ navigation }: { navigation: any }) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)
  const { user } = useAppState();
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState('');
  // Response
  const [responseState, setResponseState] = useState<'referencing' | 'generating' | 'done'>('done');
  const [response, setResponse] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isAnimatingText, setIsAnimatingText] = useState(false);
  const typingAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [responseReviews, setResponseReviews] = useState<{ review: ReviewModel, score: number }[]>([]);

  useEffect(() => {
    if (responseState === 'done') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [responseState]);

  // Clean up animation timeout on unmount
  useEffect(() => {
    return () => {
      if (typingAnimationRef.current) {
        clearTimeout(typingAnimationRef.current);
      }
    };
  }, []);

  // Animate the text character by character
  useEffect(() => {
    if (response && responseState === 'done') {
      setDisplayedResponse('');
      setIsAnimatingText(true);
      
      let currentIndex = 0;
      const animateText = () => {
        if (currentIndex <= response.length) {
          setDisplayedResponse(response.substring(0, currentIndex));
          currentIndex += 1;
          
          // Scroll to see new text as it appears
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 10);
          
          // Speed can be adjusted - smaller number = faster typing
          const charDelay = 0; 
          typingAnimationRef.current = setTimeout(animateText, charDelay);
        } else {
          setIsAnimatingText(false);
        }
      };
      
      typingAnimationRef.current = setTimeout(animateText, 10);
    }
  }, [response, responseState]);

  const handleAsk = async () => {
    if (!query.trim() || responseState !== 'done' || !user) return
    
    // Clear any ongoing animation
    if (typingAnimationRef.current) {
      clearTimeout(typingAnimationRef.current);
      typingAnimationRef.current = null;
    }

    inputRef.current?.blur();
    
    const message = query.trim();
    setQuery('');
    setQuestion(message);
    setResponse('');
    setDisplayedResponse('');
    setResponseReviews([]);
    setResponseState('referencing');

    try {
      // Get question's embedding
      const translateResponse = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message, targetLang: 'en' })
      })
      const translateData = (await translateResponse.json()).data;
      const enContent = translateData.translatedText;

      const embeddingResponse = await fetch(`${Config.api.url}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: enContent })
      })
      const embeddingData = await embeddingResponse.json()
      const vector = embeddingData.data.vector

      // Search for related reviews
      const searchResponse = await fetch(`${Config.api.url}/qdrant/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vector })
      })
      const searchResults = (await searchResponse.json()).data.results;
      const newResponseReviews = [];
      for (const result of searchResults) {
        const reviewResponse = await fetch(`${Config.api.url}/data?table=reviews&id=${result.id}`);
        const reviewData = (await reviewResponse.json()).data;
        newResponseReviews.push({ review: reviewData, score: result.score });
      }
      setResponseReviews(newResponseReviews);

      setResponseState('generating');

      // Generate response based on search results
      const askResponse = await fetch(`${Config.api.url}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: getSystemPrompt(newResponseReviews),
          message,
        })
      });
      const responseText = (await askResponse.json()).data.response;
      setResponse(responseText);
    
      const ask: AskModel = {
        id: generateRandomString(30, 'ask'),
        user_id: user.id,
        question: message,
        response: responseText,
        referenced_reviews: searchResults.map((result: any) => ({ id: result.id, score: result.score })),
        created_at: new Date().toISOString()
      };
      await fetch(`${Config.api.url}/data?table=asks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ask)
      });
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setResponseState('done')
    }
  }

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('ask.title', 'Ask Question')}</Text>
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
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* Chat body */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {(question || displayedResponse || responseReviews.length > 0) ? (
              <>
                {/* Question */}
                {question && <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>{question}</Text>
                </View>}

                {/* Status */}
                {responseState !== 'done' ? <View style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <PrettyLoadingIcon width={16} height={16} stroke={'#aaa'} />
                  <Text style={styles.statusText}>{responseState === 'referencing' ? t('ask.isReferencing') : t('ask.isGenerating')}</Text> 
                </View>
                  : <></>}

                {/* Animated Response Text */}
                {displayedResponse ? (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>{displayedResponse}</Text>
                    {isAnimatingText && (
                      <View style={styles.cursorContainer}>
                        <Text style={styles.cursor}>|</Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Relevant reviews button */}
                {(responseState === 'done' && responseReviews.length > 0) && <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <PrettyButton
                    style={styles.relevantReviewsButton}
                    onPress={() => navigation.navigate('RelevantReviews', { reviews: responseReviews })}
                  >
                    <Text style={styles.relevantReviewsText}>{t('ask.relevantReviews', 'Relevant reviews')}</Text>
                  </PrettyButton>
                </View>}
              </>
            ) : (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>{t('ask.emptyChat', 'Ask a question to get started')}</Text>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('ask.inputPlaceholder')}
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={1}
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <PrettyButton
            style={styles.sendButton}
            onPress={handleAsk}
            disabled={responseState !== 'done' || !query.trim()}
          >
            {responseState !== 'done' ? (
              <PrettyLoadingIcon width={16} height={16} stroke={'#fff'} />
            ) : (
              <SendIcon width={16} height={16} stroke={'#fff'} />
            )}
          </PrettyButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
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
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyChatText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    padding: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: Colors.primary,
  }
})

export default AskScreen