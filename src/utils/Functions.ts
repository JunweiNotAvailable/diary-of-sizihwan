import { ReviewModel, UserModel } from "./Interfaces";
import { Locations } from "./Constants";

export const generateRandomString = (length: number, prefix?: string) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return prefix ? `${prefix}_${result}` : result;
}

export const getDateString = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
      return diffMinutes === 0 ? `${Math.round(diffTime / 1000)}s` : `${diffMinutes}m`;
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
export const isNSYSUEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain?.includes('nsysu');
}

export const parseMarkdown = (text: string) => {
  if (!text) return [];

  // Define regex patterns for different markdown styles
  const patterns = [
    { pattern: /\*\*\*(.*?)\*\*\*/g, style: { fontWeight: 'bold', fontStyle: 'italic' } },
    { pattern: /\*\*(.*?)\*\*/g, style: { fontWeight: 'bold' } },
    { pattern: /\*(.*?)\*/g, style: { fontStyle: 'italic' } },
    { pattern: /_(.*?)_/g, style: { textDecorationLine: 'underline' } },
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

// Get the location detection prompt with available locations
export const getLocationCheckPrompt = (): string => {
  // Format the available locations as a readable list
  const locationsList = Locations.nsysu.map(loc => 
    `- ID: "${loc.id}", Chinese Name: "${loc.name}", English Name: "${loc.name_en}"`
  ).join('\n');
  
  return `
You are a location detection assistant for a campus app. Your sole job is to analyze if the user's message is location-based or not.

Available campus locations:
${locationsList}

Examples of location-based questions:
- Where is the library located?
- How do I get to the student center?
- What's the closest convenience store to the engineering building?
- Where can I find food on campus?
- How far is the dormitory from the main building?
- Are there any study spaces in the science building?
If message is location-based, but not about specific locations, should return all locations, example of these types of questions:
- Where am I?
- Where's the nearest study spot in campus?
- Where's the nearest restroom?

IMPORTANT: If the user is asking about specific campus locations, respond with a valid JSON object in the following format:
{
  "isLocationQuestion": true,
  "locations": ["location_id1", "location_id2", ...]
}

Where "locations" is an array containing the IDs of relevant locations from the available campus locations listed above. Include ALL possible locations that might be relevant to the query.

If the query is not about physical locations, respond with:
{
  "isLocationQuestion": false
}

DO NOT include any explanatory text, ONLY return the JSON object.
`.trim();
};

// Legacy constant for backward compatibility
export const checkLocationPrompt = getLocationCheckPrompt();

// Helper function to calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Get the system prompt
export const getSystemPrompt = (userLocation: { latitude: number, longitude: number }, locations: { name: string, name_en: string, coordinates: { latitude: number, longitude: number } }[], reviews: { review: ReviewModel, score: number, user: UserModel }[], language?: 'English' | 'zh-TW'): string => {
  const isEnglish = language !== 'zh-TW';
  
  // Create location information section if locations are provided
  let locationInfo = '';
  if (locations && locations.length > 0) {
    // Map locations with distance information if user location is available
    const locationsWithDistance = locations.map((loc, i) => {
      let locationText = `${isEnglish ? loc.name_en : loc.name}`;
      
      // Add distance information if user location is available
      if (userLocation && loc.coordinates) {
        const distance = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          loc.coordinates.latitude, 
          loc.coordinates.longitude
        );
        
        // Convert to appropriate unit and add to location info
        const distanceText = distance < 1000 
          ? `${Math.round(distance)} meters` 
          : `${(distance / 1000).toFixed(1)} km`;
          
        locationText += ` (${distanceText} from your current location)`;
      }
      
      return locationText;
    }).join('\n');
    
    // Add extra instructions for directions if user location is available
    const directionsInstruction = userLocation 
      ? "\n- Directions from the student's current location" 
      : "";
    
    locationInfo = `
You need to provide information about the following campus locations if user has asked about them:
${locationsWithDistance}
`;
  }
  
  return `
You are a helpful and honest campus assistant AI. A student has asked a question about campus life. Your job is to answer them using the experiences and reviews written by other students.${locationInfo ? '\n' + locationInfo : ''}

Here are relevant student posts tagged as helpful:
-----

${reviews
    .map((r, i) => {
      // Find the location object from Locations.nsysu based on the location ID
      const locationObj = Locations.nsysu.find((loc: { id: string, name: string, name_en: string }) => loc.id === r.review.location);
      // Use the appropriate name based on language
      const locationName = locationObj ? (isEnglish ? locationObj.name_en : locationObj.name) : r.review.location;
      
      return `${i + 1}. ${r.review.title}:\nStudent: ${r.user.name}\nPosted date: ${getDateString(r.review.created_at)}\nLocation: ${locationName}\n\n${r.review.content}`;
    })
    .join('\n\n')}

-----

Use only the information from the reviews above. Summarize trends, highlight common insights, and avoid making up information not reflected in the posts. 
Be clear, concise, and use a casual and friendly tone, using emojis occassionally is allowed.
If there's conflicting info, reflect that honestly in your answer.
${locations && locations.length > 0 ? `\nIf the question relates to campus locations, try to be specific about directions, accessibility, and useful features of these places.${userLocation ? ' Since the student has shared their current location, provide guidance on how to get to the relevant locations from where they are now.' : ''}` : ''}

Rules:
- Use plain text, no markdown.
- Respond in user's language: ${language || 'English'}.
`.trim();
};
