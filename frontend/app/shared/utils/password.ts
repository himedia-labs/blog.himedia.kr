import { PASSWORD_PATTERN } from '@/app/shared/constants/config/auth.config';

/**
 * 비밀번호 검증
 * @description 비밀번호 정책을 만족하는지 확인
 */
export const isValidPassword = (value: string): boolean => PASSWORD_PATTERN.test(value);
