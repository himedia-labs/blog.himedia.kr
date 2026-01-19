// 비밀번호 패턴
export const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// 인증 만료 시간(초)
export const RESET_CODE_EXPIRY_SECONDS = 600;

// 이메일 정규식
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
