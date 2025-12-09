import type { UseMutationResult } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// 로그아웃 처리
export const handleLogout = (params: {
  logoutMutation: UseMutationResult<void, Error, void>;
  clearAuth: () => void;
  queryClient: QueryClient;
  authKeys: { currentUser: readonly string[] };
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
  router: AppRouterInstance;
}) => {
  return async () => {
    params.logoutMutation.mutate(undefined, {
      // 성공 시
      onSuccess: () => {
        // client, server store 상태 삭제
        params.clearAuth();
        params.queryClient.setQueryData(params.authKeys.currentUser, null);
        params.queryClient.invalidateQueries({ queryKey: params.authKeys.currentUser });
        params.showToast({ message: '로그아웃되었습니다.', type: 'success' });
        params.router.push('/');
      },
      // 실패 시
      onError: () => {
        params.showToast({ message: '로그아웃에 실패했습니다.', type: 'error' });
      },
    });
  };
};
