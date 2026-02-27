import { createHmac } from 'crypto';

/**
 * 시크릿 키 버퍼 변환
 * @description hex 문자열이면 hex로, 아니면 utf8 문자열로 버퍼를 생성
 */
const toSecretBuffer = (secretKey: string): Buffer => {
  const trimmedSecretKey = secretKey.trim();
  const isHex = /^[a-fA-F0-9]+$/.test(trimmedSecretKey) && trimmedSecretKey.length % 2 === 0;

  if (isHex) {
    return Buffer.from(trimmedSecretKey, 'hex');
  }

  return Buffer.from(trimmedSecretKey, 'utf8');
};

/**
 * 채널톡 memberHash 생성
 * @description HM_CHANNEL_TALK_SECRET_KEY와 memberId로 HMAC-SHA256 해시를 생성
 */
export const createChannelTalkMemberHash = (memberId: string, secretKey: string): string | null => {
  if (!memberId?.trim() || !secretKey?.trim()) {
    return null;
  }

  const secretBuffer = toSecretBuffer(secretKey);
  return createHmac('sha256', secretBuffer).update(memberId).digest('hex');
};
