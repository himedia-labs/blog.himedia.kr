import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type {
  AuthStep,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SendResetCodeRequest,
  SendResetCodeResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
} from '@/app/shared/types/auth';
import type { ApiErrorResponse } from '@/app/shared/types/error';

/**
 * 비밀번호 상태 초기화
 * @description 비밀번호 입력/에러 상태를 초기화
 */
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

/**
 * 인증번호 발송
 * @description 이메일 인증번호 발송을 요청
 */
export const sendCode = (params: {
  email: string;
  setEmailError: (value: string) => void;
  setCodeError: (value: string) => void;
  setCodeSent: (value: boolean) => void;
  sendCodeMutation: UseMutationResult<SendResetCodeResponse, Error, SendResetCodeRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
  onSendSuccess?: () => void;
}) => {
  return (e?: React.FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (params.sendCodeMutation.isPending) return;

    // 클라이언트 검증 (체크만, 메시지는 백엔드에서)
    if (!params.email) {
      return;
    }

    params.sendCodeMutation.mutate(
      { email: params.email },
      {
        onSuccess: (data: SendResetCodeResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.setCodeSent(true);
          params.onSendSuccess?.();
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const data = axiosError.response?.data;
          const code = data?.code;
          const message = data?.message;

          switch (code) {
            case 'VALIDATION_FAILED': {
              const emailMessage = data?.errors?.email?.[0] ?? message;
              if (emailMessage) {
                params.setEmailError(emailMessage);
              }
              break;
            }
            case 'PASSWORD_TOO_MANY_REQUESTS':
              params.showToast({
                message: message ?? '인증번호 요청이 많습니다. 잠시 후 다시 시도해주세요.',
                type: 'warning',
              });
              break;
            case 'EMAIL_SEND_FAILED':
              params.showToast({
                message: message ?? '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
                type: 'error',
              });
              break;
            default:
              if (message) {
                params.showToast({ message, type: 'error' });
              }
          }
        },
      },
    );
  };
};

/**
 * 인증번호 검증
 * @description 이메일 인증번호를 검증
 */
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

    if (params.verifyCodeMutation.isPending) return;

    // 클라이언트 검증 (체크만, 메시지는 백엔드에서)
    if (!params.email || !params.code) {
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
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const data = axiosError.response?.data;
          const code = data?.code;
          const message = data?.message;

          switch (code) {
            case 'VALIDATION_FAILED':
              if (data?.errors?.email?.[0]) {
                params.setEmailError(data.errors.email[0]);
              }
              if (data?.errors?.code?.[0]) {
                params.setCodeError(data.errors.code[0]);
              }
              break;
            case 'PASSWORD_INVALID_RESET_CODE':
              if (message) {
                params.setCodeError(message);
              }
              break;
            default:
              if (message) {
                params.showToast({ message, type: 'warning' });
              }
          }
        },
      },
    );
  };
};

/**
 * 새 비밀번호 설정
 * @description 검증된 인증번호로 비밀번호를 변경
 */
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

    if (params.resetPasswordMutation.isPending) return;

    // 클라이언트 검증 (체크만, 메시지는 백엔드에서)
    if (
      !params.newPassword ||
      !params.isValidPassword(params.newPassword) ||
      !params.confirmPassword ||
      params.newPassword !== params.confirmPassword
    ) {
      return;
    }

    params.resetPasswordMutation.mutate(
      { email: params.email, code: params.code, newPassword: params.newPassword },
      {
        onSuccess: (data: ResetPasswordResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.router.push('/login');
        },
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const data = axiosError.response?.data;
          const code = data?.code;
          const message = data?.message;

          switch (code) {
            case 'VALIDATION_FAILED':
              if (data?.errors?.newPassword?.[0]) {
                params.setNewPasswordError(data.errors.newPassword[0]);
              }
              if (data?.errors?.code?.[0]) {
                params.setCodeError(data.errors.code[0]);
              }
              break;
            case 'PASSWORD_INVALID_RESET_CODE':
              if (message) {
                params.setCodeError(message);
              }
              break;
            default:
              if (message) {
                params.showToast({ message, type: 'warning' });
              }
          }
        },
      },
    );
  };
};
