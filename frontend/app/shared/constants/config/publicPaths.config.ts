// Auth가 필요없는 경로들
export const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/password/send-code',
  '/auth/password/verify-code',
  '/auth/password/reset-with-code',
] as const;
