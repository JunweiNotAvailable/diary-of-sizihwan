import { ReviewModel } from "./Interfaces";
import { useEffect, useRef, useState } from 'react';

export const generateRandomString = (length: number, prefix?: string) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return prefix ? `${prefix}_${result}` : result;
}

export const getTimeFromNow = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffTime = Math.abs(now.getTime() - then.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show hours
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      // Less than an hour ago
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes === 0 ? 'just now' : `${diffMinutes}m`;
    }
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    // Less than a week ago
    return `${diffDays}d`;
  } else if (diffDays < 30) {
    // Less than a month ago
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w`;
  } else if (diffDays < 365) {
    // Less than a year ago
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo`;
  } else {
    // More than a year ago
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y`;
  }
}

export const parseMarkdown = (text: string) => {
  if (!text) return [];

  // Define regex patterns for different markdown styles
  const patterns = [
    { pattern: /\*\*\*(.*?)\*\*\*/g, style: { fontWeight: 'bold', fontStyle: 'italic' } },
    { pattern: /\*\*(.*?)\*\*/g, style: { fontWeight: 'bold' } },
    { pattern: /\*(.*?)\*/g, style: { fontStyle: 'italic' } },
    { pattern: /_(.*?)_/g, style: { textDecorationLine: 'underline' } },
    { pattern: /-(.*?)-/g, style: { textDecorationLine: 'line-through' } }
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

// Chat socket
export const useChatSocket = (url: string, systemPrompt: string, userMessage: string) => {
  const [response, setResponse] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ systemPrompt, message: userMessage }));
    };

    socket.onmessage = (event) => {
      if (event.data === '[DONE]') {
        socket.close();
        return;
      }
      setResponse(prev => prev + event.data);
    };

    return () => socket.close();
  }, [url, systemPrompt, userMessage]);

  return response;
};

// Get the system prompt
export const getSystemPrompt = (reviews: { review: ReviewModel, score: number }[]): string => `
You are a helpful and honest campus assistant AI. A student has asked a question about campus life. Your job is to answer them using only the experiences and reviews written by other students.

Here are relevant student posts tagged as helpful:

${reviews
    .map((r, i) => `${i + 1}. ${r.review.title}:\nLocation: ${r.review.location}\n${r.review.content}\n\n(Relevance score: ${r.score})`)
    .join('\n\n')}

Use only the information from the reviews above. Summarize trends, highlight common insights, and avoid making up information not reflected in the posts. Be clear, concise, and speak like a student giving honest advice.

If there's conflicting info, reflect that honestly in your answer.

Rules:
- Use plain text, no markdown.
- Respond in user's language.
`.trim();
