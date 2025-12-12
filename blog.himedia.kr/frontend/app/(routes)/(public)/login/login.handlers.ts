import type { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { LoginRequest, AuthResponse } from '@/app/shared/types/auth';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuthStore } from '@/app/shared/store/authStore';

// 로그인 로직
export const authenticateUser = (params: {
  email: string;
  password: string;
  setEmailError: (value: string) => void;
  setPasswordError: (value: string) => void;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
  queryClient: QueryClient;
  authKeys: { currentUser: readonly string[] };
  router: AppRouterInstance;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    params.setEmailError('');
    params.setPasswordError('');

    let hasError = false;

    if (!params.email) {
      params.setEmailError('이메일을 입력해주세요.');
      hasError = true;
    }

    if (!params.password) {
      params.setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    }

    if (hasError) return;

    params.loginMutation.mutate(
      {
        email: params.email,
        password: params.password,
      },
      {
        // 로그인 성공 시
        onSuccess: (data: AuthResponse) => {
          // authStore 업데이트
          const { setAccessToken, setInitialized } = useAuthStore.getState();
          setAccessToken(data.accessToken);
          setInitialized(true);

          // 로그인 응답의 사용자 정보를 React Query 캐시에 저장 (GET /auth/me 중복 호출 방지)
          params.queryClient.setQueryData(params.authKeys.currentUser, data.user);
          params.router.push('/');
        },
        // 로그인 실패 시
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

          // 에러 메시지 필드별 처리
          if (message?.includes('이메일')) {
            params.setEmailError(message);
          } else if (message?.includes('비밀번호')) {
            params.setPasswordError(message);
          } else if (message) {
            params.showToast({ message, type: 'warning' });
          }
        },
      },
    );
  };
};
