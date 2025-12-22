export const LOGIN_RATE_LIMIT_CONFIG = {
  EMAIL: {
    // 로그인: 이메일 기준 분당/시간당 허용 횟수
    PER_MINUTE: { WINDOW_MS: 60 * 1000, LIMIT: 5 },
    PER_HOUR: { WINDOW_MS: 60 * 60 * 1000, LIMIT: 20 },
  },
  IP: {
    // 로그인: IP 기준 분당/시간당 허용 횟수
    PER_MINUTE: { WINDOW_MS: 60 * 1000, LIMIT: 20 },
    PER_HOUR: { WINDOW_MS: 60 * 60 * 1000, LIMIT: 100 },
  },
} as const;

export const PASSWORD_RATE_LIMIT_CONFIG = {
  EMAIL: {
    // 비밀번호 재설정: 이메일 기준 분당/시간당 허용 횟수
    PER_MINUTE: { WINDOW_MS: 60 * 1000, LIMIT: 3 },
    PER_HOUR: { WINDOW_MS: 60 * 60 * 1000, LIMIT: 6 },
  },
  IP: {
    // 비밀번호 재설정: IP 기준 분당/시간당 허용 횟수
    PER_MINUTE: { WINDOW_MS: 60 * 1000, LIMIT: 10 },
    PER_HOUR: { WINDOW_MS: 60 * 60 * 1000, LIMIT: 30 },
  },
} as const;
