export const Config = {
  api: {
    url: (process.env as any).EXPO_PUBLIC_API_URL || 'http://172.20.10.3:3000',
  },
  storage: {
    user: 'current_user',
  },
  s3: {
    bucketName: 'review-my-campas-assets',
    region: 'us-east-1',
  }
}
