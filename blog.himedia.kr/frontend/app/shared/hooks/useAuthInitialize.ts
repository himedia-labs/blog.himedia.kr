import { useEffect, useRef } from 'react';

import { getTokenExpiry } from '../utils/token';
import { axiosInstance } from '../network/axios.config';
import { useAuthStore } from '@/app/shared/store/authStore';

const TOKEN_REFRESH_THRESHOLD_MS = 1000 * 90; // 만료 90초 전부터 갱신
const REFRESH_ENDPOINT = '/auth/refresh';

/**
 * 앱 초기화 시 한 번만 실행되는 인증 초기화 훅
 * - 성공 시: accessToken 저장, isAuthenticated = true
 * - 실패 시: 비로그인 상태 확정
 * @description 클라이언트 초기 렌더에서 토큰 갱신을 시도해 인증 상태를 확정한다
 */
export const useAuthInitialize = () => {
  const hasInitialized = useRef(false);
  const { accessToken, setAccessToken, setAuthenticated, setInitialized } = useAuthStore();

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      // 메모리에 남아있는 accessToken이 충분히 유효하면 refresh 생략
      const expiry = accessToken ? getTokenExpiry(accessToken) : null;
      const expiresSoon = expiry ? expiry - Date.now() <= TOKEN_REFRESH_THRESHOLD_MS : true;

      if (accessToken && expiry && !expiresSoon) {
        setAuthenticated(true);
        setInitialized(true);
        return;
      }

      try {
        const response = await axiosInstance.post(REFRESH_ENDPOINT);

        if (response.status === 204 || !response.data?.accessToken) {
          setAccessToken(null);
          setAuthenticated(false);
          setInitialized(true);
          return;
        }

        const { accessToken: newAccessToken } = response.data;
        setAccessToken(newAccessToken);
        setAuthenticated(true);
      } catch {
        setAccessToken(null);
        setAuthenticated(false);
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [accessToken, setAccessToken, setAuthenticated, setInitialized]);
};
