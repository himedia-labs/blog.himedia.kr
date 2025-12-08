import { useQuery } from '@tanstack/react-query';

import { authApi } from './auth.api';
import { authKeys } from './auth.keys';
import { useAuthStore } from '@/app/shared/store/authStore';

import type { User } from '@/app/shared/types/auth';

/**
 * 사용자 조회
 * - 초기화 완료 + 인증 상태일 때만 실행 (enabled)
 * - 과도한 재조회 방지: staleTime(캐시[5분간 "신선"으로 재요청 생략])/gcTime(캐시[마지막 사용 후 10분 보관]) 설정, refetchOnMount/windowFocus 비활성화
 * - 실패 자동 재시도 없음
 */
export const useCurrentUser = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  return useQuery<User>({
    queryKey: authKeys.currentUser,
    queryFn: authApi.getCurrentUser,
    enabled: isInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
