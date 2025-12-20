export const TOKEN_CONFIG = {
  REFRESH_COOKIE_NAME: 'refreshToken',
  REFRESH_TOKEN_SECRET_LENGTH: 32,

  /**
   * Refresh Token 전체 길이
   * @description UUID(36) + separator(1) + secret_hex(64) = 101
   */
  REFRESH_TOKEN_LENGTH: 36 + 1 + 32 * 2, // 101

  /**
   * Refresh Token 재발급 최소 간격 (ms)
   * @description 짧은 시간 내 반복 refresh 시 회전을 생략해 과도한 해싱/DB 쓰기 방지
   */
  REFRESH_ROTATION_GRACE_MS: 10_000,
};
