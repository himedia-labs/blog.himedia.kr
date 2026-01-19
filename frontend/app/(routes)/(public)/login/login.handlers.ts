import { useAuthStore } from '@/app/shared/store/authStore';
import { LOGIN_MESSAGES } from '@/app/shared/constants/messages/auth.message';

import type { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { LoginRequest, AuthResponse } from '@/app/shared/types/auth';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// 로그인 로직
export const authenticateUser = (params: {
  email: string;
  password: string;
  setEmailError: (value: string) => void;
  setPasswordError: (value: string) => void;
  redirectTo?: string | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
  queryClient: QueryClient;
  authKeys: { currentUser: readonly string[] };
  router: AppRouterInstance;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    if (params.loginMutation.isPending) return;

    let hasError = false;
    if (!params.email) {
      params.setEmailError(LOGIN_MESSAGES.missingEmail);
      hasError = true;
    }
    if (!params.password) {
      params.setPasswordError(LOGIN_MESSAGES.missingPassword);
      hasError = true;
    }
    if (hasError) {
      params.showToast({ message: LOGIN_MESSAGES.missingCredentials, type: 'warning' });
      return;
    }

    params.loginMutation.mutate(
      {
        email: params.email,
        password: params.password,
      },
      {
        // 로그인 성공 시
        onSuccess: (data: AuthResponse) => {
          // authStore 업데이트
          const { setAccessToken } = useAuthStore.getState();
          setAccessToken(data.accessToken);

          // 로그인 응답의 사용자 정보를 React Query 캐시에 저장 (GET /auth/me 중복 호출 방지)
          params.queryClient.setQueryData(params.authKeys.currentUser, data.user);
          params.showToast({ message: LOGIN_MESSAGES.success, type: 'success' });
          params.router.push(params.redirectTo ?? '/');
        },
        // 로그인 실패 시
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const { message } = axiosError.response?.data || {};

          // 백엔드 메시지 Toast로 표시
          if (message) {
            params.showToast({
              message,
              type: 'warning',
            });
          } else {
            params.showToast({ message: LOGIN_MESSAGES.fallbackError, type: 'error' });
          }
        },
      },
    );
  };
};
