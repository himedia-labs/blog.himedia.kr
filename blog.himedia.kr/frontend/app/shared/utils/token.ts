// JWT 토큰의 만료 시간(exp) 가져오기 유틸리티 함수
const parseJwt = (token: string): { exp?: number } | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

// 토큰의 만료 시간을 밀리초 단위로 반환
export const getTokenExpiry = (token: string): number | null => {
  const payload = parseJwt(token);
  return payload?.exp ? payload.exp * 1000 : null;
};
