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
  },
  settings?: {
    language?: string;
    theme?: string;
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
    is_anonymous?: boolean;
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