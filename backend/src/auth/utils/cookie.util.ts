import type { Response } from 'express';
import type { ConfigType } from '@nestjs/config';

import appConfig from '../../common/config/app.config';

/**
 * 쿠키 기본 옵션 생성
 * @description 환경에 따른 보안 쿠키 설정
 */
const getCookieOptions = (env?: string) => ({
  httpOnly: true,
  secure: env === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

/**
 * 인증 쿠키 설정
 * @description Refresh Token을 httpOnly 쿠키에 저장
 */
export const setCookies = (res: Response, refreshToken: string, config: ConfigType<typeof appConfig>) => {
  const cookieOptions = getCookieOptions(config.env);
  const refreshMaxAgeSeconds = Number(config.jwt.refreshExpiresInSeconds);

  // Refresh Token 쿠키 설정 (초 > 밀리초)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: refreshMaxAgeSeconds * 1000,
  });
};

/**
 * 인증 쿠키 삭제
 * @description 로그아웃 시 Refresh Token 쿠키 제거
 */
export const clearCookies = (res: Response, config: ConfigType<typeof appConfig>) => {
  const cookieOptions = getCookieOptions(config.env);
  res.clearCookie('refreshToken', cookieOptions);
};
