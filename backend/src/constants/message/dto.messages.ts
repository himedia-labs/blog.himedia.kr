/**
 * Validation 에러 메시지
 * - DTO에서 사용되는 검증 메시지 통합 관리
 */
export const VALIDATION_MESSAGES = {
  // 이메일
  EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  EMAIL_MAX_LENGTH: '이메일은 255자 이하여야 합니다.',

  // 비밀번호
  PASSWORD_STRING: '비밀번호는 문자열이어야 합니다.',
  PASSWORD_MIN_LENGTH: '비밀번호는 최소 8자 이상이어야 합니다.',
  PASSWORD_MAX_LENGTH: '비밀번호는 255자 이하여야 합니다.',
  PASSWORD_PATTERN: '최소 8자의 영문, 숫자, 특수문자를 입력해주세요.',

  // 현재 비밀번호
  CURRENT_PASSWORD_STRING: '현재 비밀번호는 문자열이어야 합니다.',
  CURRENT_PASSWORD_MIN_LENGTH: '현재 비밀번호는 최소 8자 이상이어야 합니다.',
  CURRENT_PASSWORD_MAX_LENGTH: '현재 비밀번호는 255자 이하여야 합니다.',

  // 새 비밀번호
  NEW_PASSWORD_STRING: '새 비밀번호는 문자열이어야 합니다.',
  NEW_PASSWORD_MIN_LENGTH: '새 비밀번호는 최소 8자 이상이어야 합니다.',
  NEW_PASSWORD_MAX_LENGTH: '새 비밀번호는 255자 이하여야 합니다.',

  // 인증번호
  CODE_STRING: '인증번호는 문자열이어야 합니다.',
  CODE_LENGTH: '인증번호는 8자리여야 합니다.',

  // 이름
  NAME_STRING: '이름은 문자열이어야 합니다.',
  NAME_MAX_LENGTH: '이름은 100자 이하여야 합니다.',

  // 전화번호
  PHONE_STRING: '전화번호는 문자열이어야 합니다.',
  PHONE_MAX_LENGTH: '전화번호는 20자 이하여야 합니다.',

  // 역할
  ROLE_ENUM: '유효한 역할을 선택해주세요.',

  // 과정
  COURSE_STRING: '과정명은 문자열이어야 합니다.',
  COURSE_MAX_LENGTH: '과정명은 255자 이하여야 합니다.',

  // 개인정보 동의
  PRIVACY_CONSENT_BOOLEAN: '개인정보 동의는 불리언 값이어야 합니다.',
  PRIVACY_CONSENT_REQUIRED: '개인정보 수집 및 이용에 동의가 필요합니다.',
} as const;
