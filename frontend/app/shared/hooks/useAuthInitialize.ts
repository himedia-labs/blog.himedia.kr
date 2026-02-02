import { useEffect } from 'react';

import { useAuthStore } from '@/app/shared/store/authStore';
import { refreshAccessToken } from '@/app/shared/network/axios.instance';

/**
 * 인증 초기화 훅
 * @description 앱 시작 시 토큰을 새로 받아 로그인 여부를 결정하고, 초기화 완료 상태를 확정한다
 */
export const useAuthInitialize = () => {
  const { setAccessToken, setInitialized } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    // 서버에 토큰 갱신 요청
    const initializeAuth = async () => {
      try {
        const newAccessToken = await refreshAccessToken();
        if (!cancelled) setAccessToken(newAccessToken);
      } catch {
        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };

    initializeAuth();

    // cleanup: 컴포넌트 unmount 시 상태 업데이트 방지
    return () => {
      cancelled = true;
    };
  }, []);
};
