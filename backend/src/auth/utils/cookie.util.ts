import type { Response } from 'express';
import { ConfigValidationException } from '../../common/exception/config.exception';

/**
 * 쿠키 기본 옵션
 * @description 보안을 위한 쿠키 설정
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * 인증 쿠키 설정
 * @description Access Token과 Refresh Token을 쿠키에 저장
 */
export const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  // Access Token 만료 시간
  const accessTokenExpires = process.env.ACCESS_TOKEN_EXPIRES_IN;
  if (!accessTokenExpires) {
    throw new ConfigValidationException('ACCESS_TOKEN_EXPIRES_IN');
  }

  const accessTokenMaxAge = Number(accessTokenExpires) * 1000;
  if (!Number.isFinite(accessTokenMaxAge) || accessTokenMaxAge <= 0) {
    throw new ConfigValidationException('ACCESS_TOKEN_EXPIRES_IN');
  }

  // Refresh Token 만료 일수
  const refreshTokenDays = process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS;
  if (!refreshTokenDays) {
    throw new ConfigValidationException('REFRESH_TOKEN_EXPIRES_IN_DAYS');
  }

  const refreshTokenDaysNum = Number(refreshTokenDays);
  if (!Number.isFinite(refreshTokenDaysNum) || refreshTokenDaysNum <= 0) {
    throw new ConfigValidationException('REFRESH_TOKEN_EXPIRES_IN_DAYS');
  }

  // Access Token 쿠키 설정
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: accessTokenMaxAge,
  });

  // Refresh Token 쿠키 설정
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: refreshTokenDaysNum * 24 * 60 * 60 * 1000,
  });
};

/**
 * 인증 쿠키 삭제
 * @description 로그아웃 시 Access Token과 Refresh Token 쿠키 제거
 */
export const clearCookies = (res: Response) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};
