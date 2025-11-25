// 인증 관련 에러 메시지
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '정확한 로그인 정보를 입력해주세요.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  EMAIL_NOT_FOUND: '등록되지 않은 이메일입니다.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다.',
  INVALID_CURRENT_PASSWORD: '현재 비밀번호가 일치하지 않습니다.',
  INVALID_REFRESH_TOKEN: '유효하지 않은 리프레시 토큰입니다.',
  EXPIRED_REFRESH_TOKEN: '리프레시 토큰이 만료되었습니다.',
  INVALID_RESET_CODE: '유효하지 않은 인증번호입니다.',
  EXPIRED_RESET_CODE: '인증번호가 만료되었습니다.',
} as const;

// 인증 관련 성공 메시지
export const AUTH_SUCCESS_MESSAGES = {
  RESET_CODE_SENT: '인증번호가 이메일로 발송되었습니다.',
  RESET_CODE_VERIFIED: '인증번호가 확인되었습니다.',
  PASSWORD_CHANGED: '비밀번호가 성공적으로 변경되었습니다.',
} as const;

// 인증 설정 상수
export const AUTH_CONFIG = {
  BCRYPT_ROUNDS: 10,
  RESET_CODE_EXPIRY_MINUTES: 10,
  RESET_CODE_LENGTH: 8,
  RESET_CODE_CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  REFRESH_TOKEN_SECRET_LENGTH: 32,
} as const;
