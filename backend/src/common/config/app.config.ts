import { registerAs } from '@nestjs/config';

/**
 * 애플리케이션 설정
 * @description 환경변수 접근을 위한 설정
 */
export default registerAs('app', () => ({
  port: parseInt(process.env.HM_NODE_PORT!),
  env: process.env.NODE_ENV,

  jwt: {
    secret: process.env.HM_JWT_SECRET!,
    refreshTokenHashSecret: process.env.HM_REFRESH_TOKEN_HASH_SECRET!,
    accessExpiresIn: parseInt(process.env.HM_ACCESS_TOKEN_EXPIRES_IN!),
    refreshExpiresInSeconds: parseInt(process.env.HM_REFRESH_TOKEN_EXPIRES_IN_SECONDS!),
  },

  cors: {
    origins: process.env
      .HM_CORS_ORIGINS!.split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  },

  email: {
    user: process.env.HM_GMAIL_USER!,
    password: process.env.HM_GMAIL_APP_PASSWORD!,
  },

  channelTalk: {
    secretKey: process.env.HM_CHANNEL_TALK_SECRET_KEY!,
  },

  r2: {
    accountId: process.env.HM_R2_ACCOUNT_ID!,
    accessKeyId: process.env.HM_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.HM_R2_SECRET_ACCESS_KEY!,
    bucket: process.env.HM_R2_BUCKET!,
    publicUrl: process.env.HM_R2_PUBLIC_URL!,
    region: process.env.HM_R2_REGION!,
    endpoint: process.env.HM_R2_ENDPOINT!,
  },
}));
