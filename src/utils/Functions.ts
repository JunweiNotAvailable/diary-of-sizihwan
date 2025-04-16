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