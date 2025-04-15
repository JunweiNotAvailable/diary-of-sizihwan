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
  settings?: UserSettings
}

export interface UserSettings {
  
}