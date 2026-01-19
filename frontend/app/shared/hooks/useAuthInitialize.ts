import { useEffect } from 'react';

import { refreshAccessToken } from '../network/axios.instance';
import { useAuthStore } from '@/app/shared/store/authStore';

/**
 * 인증 초기화 훅
 * @description 앱 시작 시 토큰 갱신 후 인증 상태를 확정
 */
export const useAuthInitialize = () => {
  const { setAccessToken, setInitialized } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const newAccessToken = await refreshAccessToken();
      setAccessToken(newAccessToken);
      setInitialized(true);
    };

    initializeAuth();
  }, [setAccessToken, setInitialized]);
};
