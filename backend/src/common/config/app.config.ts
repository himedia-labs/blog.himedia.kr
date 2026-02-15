import { registerAs } from '@nestjs/config';

/**
 * 애플리케이션 설정
 * @description 환경변수 접근을 위한 설정
 */
export default registerAs('app', () => ({
  port: parseInt(process.env.NODE_PORT!),
  env: process.env.NODE_ENV,

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshTokenHashSecret: process.env.REFRESH_TOKEN_HASH_SECRET!,
    accessExpiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN!),
    refreshExpiresInSeconds: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS!),
  },

  cors: {
    origins: process.env
      .CORS_ORIGINS!.split(',')
      .map(origin => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  },

  email: {
    user: process.env.GMAIL_USER!,
    password: process.env.GMAIL_APP_PASSWORD!,
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
    publicUrl: process.env.R2_PUBLIC_URL!,
    region: process.env.R2_REGION!,
    endpoint: process.env.R2_ENDPOINT!,
  },
}));
