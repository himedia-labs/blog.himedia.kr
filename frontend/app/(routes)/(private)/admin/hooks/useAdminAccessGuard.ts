import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 관리자 접근 가드
 * @description 인증 및 권한 상태에 따라 접근 제어 리다이렉트를 수행
 */
export const useAdminAccessGuard = (params: {
  isAdmin: boolean;
  accessToken: string | null;
  isInitialized: boolean;
  isUserLoading: boolean;
}) => {
  const router = useRouter();

  // 인증 리다이렉트
  useEffect(() => {
    if (!params.isInitialized) return;
    if (!params.accessToken) router.replace('/login?reason=auth&redirect=/admin');
  }, [params.accessToken, params.isInitialized, router]);

  // 권한 리다이렉트
  useEffect(() => {
    if (!params.isInitialized || !params.accessToken || params.isUserLoading) return;
    if (!params.isAdmin) router.replace('/');
  }, [params.accessToken, params.isAdmin, params.isInitialized, params.isUserLoading, router]);
};
