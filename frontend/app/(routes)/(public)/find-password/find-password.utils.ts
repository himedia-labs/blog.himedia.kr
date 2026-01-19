import { PASSWORD_PATTERN } from '@/app/shared/constants/limits/passwordReset.limit';

/**
 * 비밀번호 검증
 * @description 비밀번호 정책을 만족하는지 확인
 */
export const isValidPassword = (value: string) => PASSWORD_PATTERN.test(value);

/**
 * 인증번호 포맷
 * @description 영문/숫자만 남기고 대문자로 변환한 뒤 8자로 제한
 */
export const formatCode = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);

/**
 * 남은 시간 포맷
 * @description 남은 시간을 mm:ss 형식으로 변환
 */
export const formatRemainingTime = (seconds: number) => {
  const clamped = Math.max(seconds, 0);
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
};
