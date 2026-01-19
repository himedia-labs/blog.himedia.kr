// 세션 스토리지 유틸리티
// - isomorphic: SSR에서는 no-op으로 동작해 에러를 방지
// - 모든 값은 JSON 직렬화/역직렬화로 타입 안정성을 보조
const isClient = () => typeof window !== 'undefined';

/**
 * 세션 스토리지 유틸
 * @description 세션 저장소 접근을 래핑
 */
export const sessionStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    if (!isClient()) return defaultValue;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    if (!isClient()) return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
  },

  removeItem: (key: string): void => {
    if (!isClient()) return;
    window.sessionStorage.removeItem(key);
  },

  hasItem: (key: string): boolean => {
    if (!isClient()) return false;
    return !!window.sessionStorage.getItem(key);
  },
};
