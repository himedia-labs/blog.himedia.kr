// 로그인 관련 메시지
export const LOGIN_MESSAGES = {
  success: '로그인 되었습니다.',
  fallbackError: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
  missingEmail: '이메일을 입력해주세요.',
  missingBirthDate: '생년월일을 입력해주세요.',
  missingPassword: '비밀번호를 입력해주세요.',
  missingCredentials: '이메일과 비밀번호를 입력해주세요.',
  requireAuth: '로그인 후 이용할 수 있어요.',
} as const;

export const EMAIL_MESSAGES = {
  invalid: '올바른 메일 형식으로 입력해주세요.',
} as const;

// 회원가입 관련 메시지
export const REGISTER_MESSAGES = {
  success: '회원가입이 완료되었습니다.\n관리자 승인 후 로그인하실 수 있습니다.',
  fallbackError: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
  // Input Form
  missingName: '이름을 입력해주세요.',
  missingEmail: '이메일을 입력해주세요.',
  missingEmailCode: '인증번호를 입력해주세요.',
  missingBirthDate: '생년월일을 입력해주세요.',
  missingPassword: '비밀번호를 입력해주세요.',
  invalidPassword: '8~32자, 공백 없이 영문/숫자/특수문자 중 2가지 이상이며 연속 3자 동일 문자는 사용할 수 없습니다.',
  missingPasswordConfirm: '비밀번호 확인을 입력해주세요.',
  passwordMismatch: '비밀번호가 일치하지 않습니다.',
  missingPhone: '전화번호를 입력해주세요.',
  missingEmailVerification: '이메일 인증을 완료해주세요.',
  emailVerified: '이메일 인증이 완료되었습니다.',
  missingRole: '역할을 선택해주세요.',
  missingCourse: '수강 과정을 입력해주세요.',
  missingPrivacyConsent: '개인정보 수집 및 이용에 동의해주세요.',
  missingRequired: '필수 정보를 모두 입력해주세요.',
} as const;

// 비밀번호 찾기 / 변경 관련 메시지
export const PASSWORD_MESSAGES = {
  resetCodeSent: '인증번호가 이메일로 발송되었습니다.',
  resetCodeVerified: '인증번호가 확인되었습니다.',
  passwordChanged: '비밀번호가 변경되었습니다.',
  fallbackError: '요청에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;
