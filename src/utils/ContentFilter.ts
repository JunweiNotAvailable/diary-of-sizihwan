import { Filter } from 'bad-words';
import bannedWords from './bannedWords.json';

// Create a singleton instance of the filter with Chinese words
const filter = new Filter();
filter.addWords(...bannedWords.words);

/**
 * Checks if text contains inappropriate content in either English or Chinese
 * @param text The text to check
 * @returns true if the text contains inappropriate content, false otherwise
 */
export const hasInappropriateContent = (text: string): boolean => {
  if (!text) return false;
  
  // Check for Chinese profanity by looking for exact matches
  for (const word of bannedWords.words) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      return true;
    }
  }
  
  // Use the built-in filter for English
  return filter.isProfane(text);
};

/**
 * Cleans text by replacing inappropriate words with asterisks
 * @param text The text to clean
 * @returns Cleaned text with inappropriate words replaced by asterisks
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  
  // Use the built-in filter to clean English text
  let cleaned = filter.clean(text);
  
  // Also clean Chinese profanity
  for (const word of bannedWords.words) {
    const regex = new RegExp(word, 'gi');
    cleaned = cleaned.replace(regex, '*'.repeat(word.length));
  }
  
  return cleaned;
}; 