// 에러 메시지
export const PASSWORD_ERROR_MESSAGES = {
  INVALID_CURRENT_PASSWORD: '현재 비밀번호가 일치하지 않습니다.',
  INVALID_RESET_CODE: '유효하지 않은 인증번호입니다.',
  EXPIRED_RESET_CODE: '인증번호가 만료되었습니다.',
  TOO_MANY_REQUESTS: '인증번호 요청이 많습니다. 잠시 후 다시 시도해주세요.',
  EMAIL_SEND_FAILED: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;

// 성공 메시지
export const PASSWORD_SUCCESS_MESSAGES = {
  RESET_CODE_SENT: '인증번호가 이메일로 발송되었습니다.',
  RESET_CODE_VERIFIED: '인증번호가 확인되었습니다.',
  PASSWORD_CHANGED: '비밀번호가 성공적으로 변경되었습니다.',
} as const;
