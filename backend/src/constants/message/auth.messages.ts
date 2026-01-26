export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '정확한 로그인 정보를 입력해주세요.',
  INVALID_CURRENT_PASSWORD: '현재 비밀번호가 일치하지 않습니다.',
  LOGIN_REQUIRED: '로그인이 필요합니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  EMAIL_NOT_FOUND: '등록되지 않은 이메일입니다.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다.',
  PHONE_ALREADY_EXISTS: '이미 등록된 전화번호입니다.',
  PENDING_APPROVAL: '관리자 승인 대기 중입니다.',
  TOO_MANY_LOGIN_ATTEMPTS: '로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.',
} as const;

export const AUTH_VALIDATION_MESSAGES = {
  EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  EMAIL_MAX_LENGTH: '이메일은 255자 이하여야 합니다.',
  NAME_STRING: '이름은 문자열이어야 합니다.',
  NAME_MAX_LENGTH: '이름은 100자 이하여야 합니다.',
  PHONE_STRING: '전화번호는 문자열이어야 합니다.',
  PHONE_MAX_LENGTH: '전화번호는 11자 이하여야 합니다.',
  ROLE_ENUM: '유효한 역할을 선택해주세요.',
  COURSE_STRING: '과정명은 문자열이어야 합니다.',
  COURSE_MAX_LENGTH: '과정명은 255자 이하여야 합니다.',
  PROFILE_BIO_STRING: '자기소개는 문자열이어야 합니다.',
  PROFILE_BIO_MAX_LENGTH: '자기소개는 500자 이하여야 합니다.',
  PROFILE_IMAGE_URL_STRING: '프로필 이미지 URL은 문자열이어야 합니다.',
  PROFILE_IMAGE_URL_MAX_LENGTH: '프로필 이미지 URL은 500자 이하여야 합니다.',
  PRIVACY_CONSENT_BOOLEAN: '개인정보 동의는 불리언 값이어야 합니다.',
  PRIVACY_CONSENT_REQUIRED: '개인정보 수집 및 이용에 동의가 필요합니다.',
} as const;
