import { createHash, createHmac } from 'crypto';

import { comparePassword } from './bcrypt.util';

const HMAC_SHA256_PREFIX = 'hmac-sha256:';
const SHA256_PREFIX = 'sha256:';

/**
 * 리프레시 토큰 시크릿 해싱
 * @description 서버 시크릿 기반 HMAC-SHA256 해시 생성
 */
export const hashRefreshTokenSecret = (secret: string, hmacSecret: string): string => {
  const hash = createHmac('sha256', hmacSecret).update(secret).digest('hex');
  return `${HMAC_SHA256_PREFIX}${hash}`;
};

/**
 * 리프레시 토큰 시크릿 검증
 * @description 저장된 해시 타입(prefix)에 따라 검증, 구버전(bcrypt/sha256)도 호환됨
 */
export const verifyRefreshTokenSecret = async (
  secret: string,
  storedHash: string,
  hmacSecret: string,
): Promise<boolean> => {
  if (storedHash.startsWith(HMAC_SHA256_PREFIX)) {
    return hashRefreshTokenSecret(secret, hmacSecret) === storedHash;
  }

  if (storedHash.startsWith(SHA256_PREFIX)) {
    const hash = createHash('sha256').update(secret).digest('hex');
    return `${SHA256_PREFIX}${hash}` === storedHash;
  }

  return comparePassword(secret, storedHash);
};
