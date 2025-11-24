import { useMutation } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { handleAuthError } from './auth.error';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  SendResetCodeRequest,
  SendResetCodeResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from './auth.types';

export const useRegisterMutation = () => {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: authApi.register,
    onError: (error) => {
      console.error('[회원가입 실패]', handleAuthError(error, '회원가입에 실패했습니다.'));
    },
  });
};

export const useLoginMutation = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: authApi.login,
    onError: (error) => {
      console.error('[로그인 실패]', handleAuthError(error, '로그인에 실패했습니다.'));
    },
  });
};

export const useSendResetCodeMutation = () => {
  return useMutation<SendResetCodeResponse, Error, SendResetCodeRequest>({
    mutationFn: authApi.sendResetCode,
    onError: (error) => {
      console.error('[인증번호 발송 실패]', handleAuthError(error, '인증번호 발송에 실패했습니다.'));
    },
  });
};

export const useVerifyResetCodeMutation = () => {
  return useMutation<VerifyResetCodeResponse, Error, VerifyResetCodeRequest>({
    mutationFn: authApi.verifyResetCode,
    onError: (error) => {
      console.error('[인증번호 검증 실패]', handleAuthError(error, '인증번호 검증에 실패했습니다.'));
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      console.error('[비밀번호 재설정 실패]', handleAuthError(error, '비밀번호 재설정에 실패했습니다.'));
    },
  });
};
