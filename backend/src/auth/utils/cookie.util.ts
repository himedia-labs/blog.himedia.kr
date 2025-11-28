import type { Response } from 'express';
import type { ConfigType } from '@nestjs/config';

import appConfig from '../../config/app.config';

/**
 * 쿠키 기본 옵션 생성
 * @description 환경에 따른 보안 쿠키 설정
 */
const getCookieOptions = (env?: string) => ({
  httpOnly: true,
  secure: env === 'production', // .env.production 일 경우
  sameSite: 'lax' as const,
  path: '/',
});

/**
 * 인증 쿠키 설정
 * @description Type-safe하게 Access Token과 Refresh Token을 쿠키에 저장
 */
export const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  config: ConfigType<typeof appConfig>,
) => {
  const cookieOptions = getCookieOptions(config.env);

  // Access Token 쿠키 설정 (초 → 밀리초)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: config.jwt.accessExpiresIn * 1000,
  });

  // Refresh Token 쿠키 설정 (일 → 밀리초)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  });
};

/**
 * 인증 쿠키 삭제
 * @description 로그아웃 시 Access Token과 Refresh Token 쿠키 제거
 */
export const clearCookies = (
  res: Response,
  config: ConfigType<typeof appConfig>,
) => {
  const cookieOptions = getCookieOptions(config.env);
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
