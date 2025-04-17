import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native'
import React, { useState } from 'react'
import { Colors } from '../../utils/Constants'
import { Config } from '../../utils/Config'

const AskScreen = () => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAsk = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      // First call /embedding to get the vector
      const translateResponse = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: query, targetLang: 'en' })
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

      if (!embeddingResponse.ok) {
        throw new Error('Failed to get embedding')
      }

      const embeddingData = await embeddingResponse.json()
      const vector = embeddingData.data.vector

      // Then call /qdrant/search with the vector
      const searchResponse = await fetch(`${Config.api.url}/qdrant/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vector })
      })

      if (!searchResponse.ok) {
        throw new Error('Failed to search with vector')
      }

      const searchResults = await searchResponse.json()

      // Log the results to console
      console.log('Search results:', searchResults.data.results)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Input field at the top */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask something..."
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Ask button at the bottom */}
        <TouchableOpacity
          style={styles.askButton}
          onPress={handleAsk}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.askButtonText}>Ask</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  inputContainer: {
    backgroundColor: Colors.primaryLightGray + '33',
    borderRadius: 12,
    padding: 8,
    marginTop: 16
  },
  input: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  spacer: {
    flex: 1
  },
  askButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})

export default AskScreen