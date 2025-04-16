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

