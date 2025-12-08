import type { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { LoginRequest, AuthResponse } from '@/app/shared/types/auth';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * @description
    1. 폼 제출 시 이메일/비밀번호 유효성 검증
    2. 로그인 API 호출
    3. 성공 : 사용자 데이터 캐싱 + 홈으로 이동
    4. 실패 : 에러 메시지 처리
 */
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
        onSuccess: (data: AuthResponse) => {
          params.queryClient.setQueryData(params.authKeys.currentUser, data.user);
          params.router.push('/');
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

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
