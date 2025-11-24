import { ApiErrorResponse } from './auth.types';

// 인증 관련 에러 처리 함수
export const handleAuthError = (error: Error, defaultMessage: string = '인증에 실패했습니다.'): string => {
  const apiError = error as ApiErrorResponse;
  const message = apiError.response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message[0] || defaultMessage;
  }

  return defaultMessage;
};
