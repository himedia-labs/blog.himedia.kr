import type { FormEvent } from 'react';

import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';

import { isValidPassword } from '@/app/shared/utils/password';
import { REGISTER_MESSAGES } from '@/app/shared/constants/messages/auth.message';

import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { RegisterRequest } from '@/app/shared/types/auth';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 회원가입 : 제출 핸들러
 * @description 회원가입 폼 제출과 에러 처리를 담당
 */
export const registerSubmit = (params: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  birthDate: string;
  role: string;
  course: string;
  privacyConsent: boolean;
  setNameError: (value: string) => void;
  setEmailError: (value: string) => void;
  setPasswordError: (value: string) => void;
  setPasswordConfirmError: (value: string) => void;
  setPhoneError: (value: string) => void;
  setBirthDateError: (value: string) => void;
  setRoleError: (value: string) => void;
  setCourseError: (value: string) => void;
  setPrivacyError: (value: string) => void;
  registerMutation: UseMutationResult<void, Error, RegisterRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning'; duration?: number }) => void;
  router: AppRouterInstance;
  onSuccessCleanup?: () => void;
}) => {
  return (event: FormEvent) => {
    event.preventDefault();

    if (params.registerMutation.isPending) return;

    // 필수 입력 검증
    let hasError = false;
    if (!params.name) {
      params.setNameError(REGISTER_MESSAGES.missingName);
      hasError = true;
    }
    if (!params.email) {
      params.setEmailError(REGISTER_MESSAGES.missingEmail);
      hasError = true;
    }
    if (!params.password) {
      params.setPasswordError(REGISTER_MESSAGES.missingPassword);
      hasError = true;
    } else if (!isValidPassword(params.password)) {
      params.setPasswordError(REGISTER_MESSAGES.invalidPassword);
      hasError = true;
    }
    if (!params.passwordConfirm) {
      params.setPasswordConfirmError(REGISTER_MESSAGES.missingPasswordConfirm);
      hasError = true;
    } else if (params.password !== params.passwordConfirm) {
      params.setPasswordConfirmError(REGISTER_MESSAGES.passwordMismatch);
      hasError = true;
    }
    if (!params.phone) {
      params.setPhoneError(REGISTER_MESSAGES.missingPhone);
      hasError = true;
    }
    if (!params.birthDate) {
      params.setBirthDateError(REGISTER_MESSAGES.missingBirthDate);
      hasError = true;
    }
    if (!params.role) {
      params.setRoleError(REGISTER_MESSAGES.missingRole);
      hasError = true;
    }
    const requiresCourse = params.role === 'trainee' || params.role === 'graduate';
    if (requiresCourse && !params.course) {
      params.setCourseError(REGISTER_MESSAGES.missingCourse);
      hasError = true;
    }
    if (!params.privacyConsent) {
      params.setPrivacyError(REGISTER_MESSAGES.missingPrivacyConsent);
      hasError = true;
    }

    if (hasError) {
      params.showToast({ message: REGISTER_MESSAGES.missingRequired, type: 'warning' });
      return;
    }

    // 전화번호에서 공백 제거
    const phoneNumber = params.phone.replace(/\s/g, '');

    // role을 대문자로 변환
    const upperRole = params.role.toUpperCase() as 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR';

    params.registerMutation.mutate(
      {
        name: params.name,
        email: params.email,
        password: params.password,
        phone: phoneNumber,
        birthDate: params.birthDate,
        role: upperRole,
        course: requiresCourse ? params.course || undefined : undefined,
        privacyConsent: params.privacyConsent,
      },
      {
        // 성공 시
        onSuccess: () => {
          params.onSuccessCleanup?.();
          params.showToast({
            message: REGISTER_MESSAGES.success,
            type: 'success',
            duration: 5000,
          });
          params.router.push('/');
        },
        // 실패 시
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const { message, code, errors } = axiosError.response?.data || {};

          // DTO 검증 실패 (백엔드 메시지 표시)
          if (code === 'VALIDATION_FAILED' && errors) {
            if (errors.name) params.setNameError(errors.name[0]);
            if (errors.email) params.setEmailError(errors.email[0]);
            if (errors.password) params.setPasswordError(errors.password[0]);
            if (errors.phone) params.setPhoneError(errors.phone[0]);
            if (errors.birthDate) params.setBirthDateError(errors.birthDate[0]);
            if (errors.role) params.setRoleError(errors.role[0]);
            if (errors.course) params.setCourseError(errors.course[0]);
            if (errors.privacyConsent) params.setPrivacyError(errors.privacyConsent[0]);
            return;
          }

          // 에러 코드별 처리 (백엔드 메시지 표시)
          switch (code) {
            case 'AUTH_EMAIL_ALREADY_EXISTS':
              if (message) {
                params.setEmailError(message);
              }
              break;
            case 'AUTH_PHONE_ALREADY_EXISTS':
              if (message) {
                params.setPhoneError(message);
              }
              break;
            default:
              if (message) {
                params.showToast({
                  message: message,
                  type: 'error',
                });
              } else {
                params.showToast({ message: REGISTER_MESSAGES.fallbackError, type: 'error' });
              }
          }
        },
      },
    );
  };
};
