import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/app/api/auth/auth.api';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendResetCodeRequest,
  UpdateProfileRequest,
  ResetPasswordResponse,
  UpdateProfileResponse,
  SendResetCodeResponse,
  VerifyResetCodeRequest,
  UpdateProfileBioRequest,
  VerifyResetCodeResponse,
  UpdateProfileBioResponse,
  UpdateProfileImageRequest,
  UpdateProfileImageResponse,
  SendEmailVerificationCodeRequest,
  SendEmailVerificationCodeResponse,
  VerifyEmailVerificationCodeRequest,
  VerifyEmailVerificationCodeResponse,
} from '@/app/shared/types/auth';

// 회원가입
export const useRegisterMutation = () => {
  return useMutation<void, Error, RegisterRequest>({
    mutationFn: authApi.register,
  });
};

// 회원가입 이메일 인증: 코드 발송
export const useSendEmailVerificationCodeMutation = () => {
  return useMutation<SendEmailVerificationCodeResponse, Error, SendEmailVerificationCodeRequest>({
    mutationFn: authApi.sendEmailVerificationCode,
  });
};

// 회원가입 이메일 인증: 코드 검증
export const useVerifyEmailVerificationCodeMutation = () => {
  return useMutation<VerifyEmailVerificationCodeResponse, Error, VerifyEmailVerificationCodeRequest>({
    mutationFn: authApi.verifyEmailVerificationCode,
  });
};

// 로그인
export const useLoginMutation = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: authApi.login,
  });
};

// 비밀번호 찾기: 코드 발송
export const useSendResetCodeMutation = () => {
  return useMutation<SendResetCodeResponse, Error, SendResetCodeRequest>({
    mutationFn: authApi.sendResetCode,
  });
};

// 비밀번호 찾기: 코드 검증
export const useVerifyResetCodeMutation = () => {
  return useMutation<VerifyResetCodeResponse, Error, VerifyResetCodeRequest>({
    mutationFn: authApi.verifyResetCode,
  });
};

// 비밀번호 재설정
export const useResetPasswordMutation = () => {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: authApi.resetPassword,
  });
};

// 자기소개 수정
export const useUpdateProfileBioMutation = () => {
  return useMutation<UpdateProfileBioResponse, Error, UpdateProfileBioRequest>({
    mutationFn: authApi.updateProfileBio,
  });
};

// 프로필 이미지 수정
export const useUpdateProfileImageMutation = () => {
  return useMutation<UpdateProfileImageResponse, Error, UpdateProfileImageRequest>({
    mutationFn: authApi.updateProfileImage,
  });
};

// 프로필 수정
export const useUpdateProfileMutation = () => {
  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: authApi.updateProfile,
  });
};

// 로그아웃
export const useLogoutMutation = () => {
  return useMutation<void, Error, void>({
    mutationFn: authApi.logout,
  });
};
