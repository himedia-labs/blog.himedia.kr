import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type {
  SendResetCodeRequest,
  SendResetCodeResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthStep,
} from '@/app/shared/types/auth';

// 비밀번호 상태 초기화
export const resetPasswordState = (params: {
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setNewPasswordError: (value: string) => void;
  setConfirmPasswordError: (value: string) => void;
}) => {
  return () => {
    params.setNewPassword('');
    params.setConfirmPassword('');
    params.setNewPasswordError('');
    params.setConfirmPasswordError('');
  };
};

// 인증번호 발송
export const sendCode = (params: {
  email: string;
  setEmailError: (value: string) => void;
  setCodeError: (value: string) => void;
  setCodeSent: (value: boolean) => void;
  sendCodeMutation: UseMutationResult<SendResetCodeResponse, Error, SendResetCodeRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    params.setEmailError('');
    params.setCodeError('');

    if (!params.email) {
      params.setEmailError('이메일을 입력해주세요.');
      return;
    }

    params.sendCodeMutation.mutate(
      { email: params.email },
      {
        onSuccess: (data: SendResetCodeResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.setCodeSent(true);
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

          if (message?.includes('이메일')) {
            params.setEmailError(message);
          } else if (message) {
            params.showToast({ message, type: 'error' });
          }
        },
      },
    );
  };
};

// 인증번호 검증
export const verifyCode = (params: {
  email: string;
  code: string;
  setEmailError: (value: string) => void;
  setCodeError: (value: string) => void;
  setStep: (value: AuthStep) => void;
  verifyCodeMutation: UseMutationResult<VerifyResetCodeResponse, Error, VerifyResetCodeRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    params.setEmailError('');
    params.setCodeError('');

    if (!params.email) {
      params.setEmailError('이메일을 입력해주세요.');
      return;
    }

    if (!params.code) {
      params.setCodeError('인증번호를 입력해주세요.');
      return;
    }

    params.verifyCodeMutation.mutate(
      { email: params.email, code: params.code },
      {
        onSuccess: (data: VerifyResetCodeResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.setStep('password');
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

          if (message?.includes('인증번호')) {
            params.setCodeError(message);
          } else if (message?.includes('이메일')) {
            params.setEmailError(message);
          } else if (message) {
            params.showToast({ message, type: 'warning' });
          }
        },
      },
    );
  };
};

// 새 비밀번호 설정
export const resetPassword = (params: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  setNewPasswordError: (value: string) => void;
  setConfirmPasswordError: (value: string) => void;
  setCodeError: (value: string) => void;
  resetPasswordMutation: UseMutationResult<ResetPasswordResponse, Error, ResetPasswordRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
  router: AppRouterInstance;
  isValidPassword: (value: string) => boolean;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    params.setNewPasswordError('');
    params.setConfirmPasswordError('');

    let hasError = false;

    if (!params.newPassword) {
      params.setNewPasswordError('새 비밀번호를 입력해주세요.');
      hasError = true;
    } else if (!params.isValidPassword(params.newPassword)) {
      params.setNewPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
      hasError = true;
    }

    if (!params.confirmPassword) {
      params.setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (params.newPassword !== params.confirmPassword) {
      params.setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    if (hasError) return;

    params.resetPasswordMutation.mutate(
      { email: params.email, code: params.code, newPassword: params.newPassword },
      {
        onSuccess: (data: ResetPasswordResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.router.push('/login');
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

          if (message?.includes('비밀번호')) {
            params.setNewPasswordError(message);
          } else if (message?.includes('인증번호')) {
            params.setCodeError(message);
          } else if (message) {
            params.showToast({ message, type: 'warning' });
          }
        },
      },
    );
  };
};
