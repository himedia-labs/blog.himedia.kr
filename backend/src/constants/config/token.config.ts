export const TOKEN_CONFIG = {
  REFRESH_COOKIE_NAME: 'refreshToken',
  REFRESH_TOKEN_SECRET_LENGTH: 32,

  /**
   * Refresh Token 전체 길이
   * @description UUID(36) + separator(1) + secret_hex(64) = 101
   */
  REFRESH_TOKEN_LENGTH: 36 + 1 + 32 * 2, // 101
};
