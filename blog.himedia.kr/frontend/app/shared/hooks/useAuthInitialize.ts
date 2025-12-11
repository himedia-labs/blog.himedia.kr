import { useEffect } from 'react';

import { axiosInstance } from '../network/axios.instance';
import { useAuthStore } from '@/app/shared/store/authStore';

/**
 * 앱 초기화 시 한 번만 실행되는 인증 초기화 훅
 * - 성공 시: accessToken 저장
 * - 실패 시: 비로그인 상태 확정
 */
export const useAuthInitialize = () => {
  const { setAccessToken, setInitialized } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await axiosInstance.post('/auth/refresh');

        if (response.status === 204 || !response.data?.accessToken) {
          setAccessToken(null);
          setInitialized(true);
          return;
        }

        const { accessToken: newAccessToken } = response.data;
        setAccessToken(newAccessToken);
        setInitialized(true);
      } catch {
        setAccessToken(null);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [setAccessToken, setInitialized]);
};
