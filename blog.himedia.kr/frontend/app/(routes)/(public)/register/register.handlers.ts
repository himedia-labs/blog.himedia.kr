import type { AxiosError } from 'axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { RegisterRequest, AuthResponse } from '@/app/shared/types/auth';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 전화번호 포맷팅
 * @description 사용자가 숫자를 입력하면 자동으로 XXX XXXX XXXX 형식으로 변환해줍니다.
 */

export const formatPhone = (params: {
  phone: string;
  setPhone: (value: string) => void;
  phoneError: string;
  setPhoneError: (value: string) => void;
}) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');

    if (value.length <= 11) {
      let formatted = value;
      if (value.length > 3 && value.length <= 7) {
        formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
      } else if (value.length > 7) {
        formatted = `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7, 11)}`;
      }
      params.setPhone(formatted);
      if (params.phoneError) params.setPhoneError('');
    }
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
  setPrivacyError: (value: boolean) => void;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterRequest>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'warning'; duration?: number }) => void;
  router: AppRouterInstance;
  isValidPassword: (value: string) => boolean;
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
    params.setPrivacyError(false);

    let hasError = false;

    // 필수 입력 체크
    if (!params.name) {
      params.setNameError('이름을 입력해주세요.');
      hasError = true;
    }

    if (!params.email) {
      params.setEmailError('이메일을 입력해주세요.');
      hasError = true;
    }

    if (!params.password) {
      params.setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    } else if (!params.isValidPassword(params.password)) {
      params.setPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
      hasError = true;
    }

    if (!params.passwordConfirm) {
      params.setPasswordConfirmError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (params.password !== params.passwordConfirm) {
      params.setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    if (!params.phone) {
      params.setPhoneError('전화번호를 입력해주세요.');
      hasError = true;
    }

    if (!params.role) {
      params.setRoleError('역할을 선택해주세요.');
      hasError = true;
    }

    if (!params.course) {
      params.setCourseError('과정명을 선택해주세요.');
      hasError = true;
    }

    if (!params.privacyConsent) {
      params.setPrivacyError(true);
      hasError = true;
    }

    if (hasError) return;

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
            message: '회원가입이 완료되었습니다.\n관리자 승인 후 로그인하실 수 있습니다.',
            type: 'success',
            duration: 5000,
          });
          setTimeout(() => {
            params.router.push('/');
          });
        },
        // 실패 시
        onError: (error: unknown) => {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message;

          if (message?.includes('이름')) {
            params.setNameError(message);
          } else if (message?.includes('이메일')) {
            params.setEmailError(message);
          } else if (message?.includes('비밀번호')) {
            params.setPasswordError(message);
          } else if (message?.includes('전화번호')) {
            params.setPhoneError(message);
          } else if (message?.includes('역할')) {
            params.setRoleError(message);
          } else if (message?.includes('과정')) {
            params.setCourseError(message);
          } else if (message) {
            // 특정 필드를 알 수 없는 경우 이메일 필드에 표시
            params.setEmailError(message);
          }
        },
      },
    );
  };
};
