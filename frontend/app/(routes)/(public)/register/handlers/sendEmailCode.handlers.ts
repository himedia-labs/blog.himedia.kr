import { EMAIL_REGEX } from '@/app/shared/constants/config/auth.config';
import { EMAIL_MESSAGES, REGISTER_MESSAGES } from '@/app/shared/constants/messages/auth.message';

import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { SendEmailVerificationCodeRequest, SendEmailVerificationCodeResponse } from '@/app/shared/types/auth';

/**
 * 회원가입 : 이메일 인증번호 발송
 * @description 이메일 인증번호 발송을 요청
 */
export const sendEmailCode = (params: {
  email: string;
  setEmailError: (value: string) => void;
  setCodeError: (value: string) => void;
  setEmailCode: (value: string) => void;
  setIsEmailCodeSent: (value: boolean) => void;
  sendCodeMutation: UseMutationResult<SendEmailVerificationCodeResponse, Error, SendEmailVerificationCodeRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning' }) => void;
}) => {
  return (e?: FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (params.sendCodeMutation.isPending) return;

    if (!params.email) {
      params.setEmailError(REGISTER_MESSAGES.missingEmail);
      params.showToast({ message: REGISTER_MESSAGES.missingEmail, type: 'warning' });
      return;
    }

    if (!EMAIL_REGEX.test(params.email)) {
      params.setEmailError(EMAIL_MESSAGES.invalid);
      params.showToast({ message: EMAIL_MESSAGES.invalid, type: 'warning' });
      return;
    }

    params.sendCodeMutation.mutate(
      { email: params.email },
      {
        onSuccess: (data: SendEmailVerificationCodeResponse) => {
          params.showToast({ message: data.message, type: 'success' });
          params.setEmailCode('');
          params.setCodeError('');
          params.setIsEmailCodeSent(true);
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
            case 'AUTH_EMAIL_ALREADY_EXISTS':
              if (message) {
                params.setEmailError(message);
              }
              break;
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
