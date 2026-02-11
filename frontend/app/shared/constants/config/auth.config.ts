// 이메일 정규식
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 패턴
export const PASSWORD_PATTERN = /^(?!.*\s)(?!.*(.)\1\1)(?=.{8,32}$)(?:(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[@$!%*?&])|(?=.*\d)(?=.*[@$!%*?&]))[A-Za-z\d@$!%*?&]+$/;

// 인증 만료 시간(초)
export const RESET_CODE_EXPIRY_SECONDS = 600;

// 공개 인증 경로
export const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'] as const;
