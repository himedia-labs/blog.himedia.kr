import { REGISTER_MESSAGES } from '@/app/shared/constants/messages/auth.message';

import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { VerifyEmailVerificationCodeRequest, VerifyEmailVerificationCodeResponse } from '@/app/shared/types/auth';

/**
 * 회원가입 : 이메일 인증번호 검증
 * @description 이메일 인증번호를 검증
 */
export const verifyEmailCode = (params: {
  code: string;
  email: string;
  setEmailError: (value: string) => void;
  setCodeError: (value: string) => void;
  setIsEmailVerified: (value: boolean) => void;
  verifyCodeMutation: UseMutationResult<VerifyEmailVerificationCodeResponse, Error, VerifyEmailVerificationCodeRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
}) => {
  return (e?: FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (params.verifyCodeMutation.isPending) return;

    if (!params.email) {
      params.setEmailError(REGISTER_MESSAGES.missingEmail);
      params.showToast({ message: REGISTER_MESSAGES.missingEmail, type: 'warning' });
      return;
    }

    if (!params.code) {
      params.setCodeError(REGISTER_MESSAGES.missingEmailCode);
      params.showToast({ message: REGISTER_MESSAGES.missingEmailCode, type: 'warning' });
      return;
    }

    params.verifyCodeMutation.mutate(
      { email: params.email, code: params.code },
      {
        onSuccess: (data: VerifyEmailVerificationCodeResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.setCodeError('');
          params.setIsEmailVerified(true);
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
            case 'AUTH_EMAIL_ALREADY_EXISTS':
              if (message) {
                params.setEmailError(message);
              }
              break;
            case 'EMAIL_INVALID_VERIFICATION_CODE':
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
