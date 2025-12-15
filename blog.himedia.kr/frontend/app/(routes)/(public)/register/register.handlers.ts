import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { isValidPassword } from '@/app/shared/utils/password';
import { REGISTER_MESSAGES } from '@/app/shared/constants/messages/auth';

import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { RegisterRequest } from '@/app/shared/types/auth';

/**
 * 전화번호 포맷팅
 * @description 사용자가 숫자를 입력하면 자동으로 XXX XXXX XXXX 형식으로 변환해줍니다.
 */
export const formatPhone = (params: {
  setPhone: (value: string) => void;
  phoneError: string;
  setPhoneError: (value: string) => void;
}) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);

    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }

    params.setPhone(formatted);
    if (params.phoneError) params.setPhoneError('');
  };
};

/**
 * 회원가입
 * @description 회원가입 폼 제출 핸들러
 */
export const register = (params: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  role: string;
  course: string;
  privacyConsent: boolean;
  setNameError: (value: string) => void;
  setEmailError: (value: string) => void;
  setPasswordError: (value: string) => void;
  setPasswordConfirmError: (value: string) => void;
  setPhoneError: (value: string) => void;
  setRoleError: (value: string) => void;
  setCourseError: (value: string) => void;
  setPrivacyError: (value: string) => void;
  registerMutation: UseMutationResult<void, Error, RegisterRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning'; duration?: number }) => void;
  router: AppRouterInstance;
  onSuccessCleanup?: () => void;
}) => {
  return (e: React.FormEvent) => {
    e.preventDefault();

    // 에러 초기화
    params.setNameError('');
    params.setEmailError('');
    params.setPasswordError('');
    params.setPasswordConfirmError('');
    params.setPhoneError('');
    params.setRoleError('');
    params.setCourseError('');
    params.setPrivacyError('');

    // 클라이언트 검증 (체크만, 메시지는 백엔드에서)
    if (
      !params.name ||
      !params.email ||
      !params.password ||
      !isValidPassword(params.password) ||
      !params.passwordConfirm ||
      params.password !== params.passwordConfirm ||
      !params.phone ||
      !params.role ||
      !params.course ||
      !params.privacyConsent
    ) {
      return;
    }

    // 전화번호에서 공백 제거
    const phoneNumber = params.phone.replace(/\s/g, '');

    // role을 대문자로 변환
    const upperRole = params.role.toUpperCase() as 'TRAINEE' | 'MENTOR' | 'INSTRUCTOR';

    params.registerMutation.mutate(
      {
        name: params.name,
        email: params.email,
        password: params.password,
        phone: phoneNumber,
        role: upperRole,
        course: params.course || undefined,
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
