const env = process.env as any;

export const Config = {
  api: {
    url: env.EXPO_PUBLIC_ENV === 'production' ? env.EXPO_PUBLIC_API_URL : 'http://172.20.10.3:3000',
  },
  storage: {
    user: 'current_user',
  },
  s3: {
    bucketName: 'review-my-campas-assets',
    region: 'us-east-1',
  }
}
