export interface UserModel {
  id: string;
  name: string;
  email: string;
  picture: string;
  password: string;
  created_at: string;
  extra?: {
    school?: string;
    bio?: string;
    badges?: ('pioneer' | 'explorer' | 'connector' | 'hero' | 'legend')[];
  },
  settings?: {
    language?: string;
    theme?: string;
    blocked_users?: string[];
  }
}

export interface ReviewModel {
  id: string;
  user_id: string;
  title: string;
  content: string;
  location: string;
  categories: string[];
  created_at: string;
  allow_reference: boolean;
  extra: {
    score: number;
    likes: string[];
  }
}

export interface EmbeddingModel {
  id: string;
  vector: number[];
  payload: {
    allow_reference: boolean;
    location: string;
    categories: string[];
  }
}

export interface AskModel {
  id: string;
  user_id: string;
  question: string;
  response: string;
  referenced_reviews: { id: string, score: number }[];
  created_at: string;
  extra?: {

  }
}