/**
 * 인증 관련 메시지 상수
 * @description 인증 관련 메시지 상수이며, 검증 에러 메시지는 백엔드에서 제공하는 메시지를 사용합니다.
 */

// 로그인 관련 메시지
export const LOGIN_MESSAGES = {
  success: '로그인 되었습니다.',
  fallbackError: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
  missingEmail: '이메일을 입력해주세요.',
  missingPassword: '비밀번호를 입력해주세요.',
  missingCredentials: '이메일과 비밀번호를 입력해주세요.',
} as const;

// 회원가입 관련 메시지
export const REGISTER_MESSAGES = {
  success: '회원가입이 완료되었습니다.\n관리자 승인 후 로그인하실 수 있습니다.',
  fallbackError: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;

// 비밀번호 찾기 / 변경 관련 메시지
export const PASSWORD_MESSAGES = {
  resetCodeSent: '인증번호가 이메일로 발송되었습니다.',
  resetCodeVerified: '인증번호가 확인되었습니다.',
  passwordChanged: '비밀번호가 변경되었습니다.',
  fallbackError: '요청에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;
