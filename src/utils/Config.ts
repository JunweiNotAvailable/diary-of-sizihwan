const env = process.env as any;

export const Config = {
  api: {
    url: env.EXPO_PUBLIC_ENV === 'development' ? 'http://172.20.10.3:3000' : 'https://review-my-campus-backend-production.up.railway.app',
  },
  storage: {
    user: 'current_user',
  },
  s3: {
    bucketName: 'review-my-campas-assets',
    region: 'us-east-1',
  }
}
