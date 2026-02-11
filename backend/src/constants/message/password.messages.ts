// 에러 메시지
export const PASSWORD_ERROR_MESSAGES = {
  INVALID_RESET_CODE: '유효하지 않은 인증번호입니다.',
  TOO_MANY_REQUESTS: '인증번호 요청이 많습니다. 잠시 후 다시 시도해주세요.',
  EMAIL_SEND_FAILED: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;

// 성공 메시지
export const PASSWORD_SUCCESS_MESSAGES = {
  RESET_CODE_SENT: '인증번호가 이메일로 발송되었습니다.',
  RESET_CODE_VERIFIED: '인증번호가 확인되었습니다.',
  PASSWORD_CHANGED: '비밀번호가 성공적으로 변경되었습니다.',
} as const;

export const PASSWORD_VALIDATION_MESSAGES = {
  PASSWORD_STRING: '비밀번호는 문자열이어야 합니다.',
  PASSWORD_MIN_LENGTH: '비밀번호는 최소 8자 이상이어야 합니다.',
  PASSWORD_MAX_LENGTH: '비밀번호는 32자 이하여야 합니다.',
  PASSWORD_PATTERN: '8~32자, 공백 없이 영문/숫자/특수문자 중 2가지 이상이며 연속 3자 동일 문자는 사용할 수 없습니다.',
  CURRENT_PASSWORD_STRING: '현재 비밀번호는 문자열이어야 합니다.',
  CURRENT_PASSWORD_MIN_LENGTH: '현재 비밀번호는 최소 8자 이상이어야 합니다.',
  CURRENT_PASSWORD_MAX_LENGTH: '현재 비밀번호는 255자 이하여야 합니다.',
  NEW_PASSWORD_STRING: '새 비밀번호는 문자열이어야 합니다.',
  NEW_PASSWORD_MIN_LENGTH: '새 비밀번호는 최소 8자 이상이어야 합니다.',
  NEW_PASSWORD_MAX_LENGTH: '새 비밀번호는 32자 이하여야 합니다.',
  CODE_STRING: '인증번호는 문자열이어야 합니다.',
  CODE_LENGTH: '인증번호는 8자리여야 합니다.',
} as const;
