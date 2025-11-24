import { axiosBare } from '@/app/shared/network/axiosConfig';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SendResetCodeRequest,
  SendResetCodeResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from './auth.types';

const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await axiosBare.post<AuthResponse>('/auth/register', data);
  return res.data;
};

const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await axiosBare.post<AuthResponse>('/auth/login', data);
  return res.data;
};

const sendResetCode = async (data: SendResetCodeRequest): Promise<SendResetCodeResponse> => {
  const res = await axiosBare.post<SendResetCodeResponse>('/auth/password/send-code', data);
  return res.data;
};

const verifyResetCode = async (data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> => {
  const res = await axiosBare.post<VerifyResetCodeResponse>('/auth/password/verify-code', data);
  return res.data;
};

const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const res = await axiosBare.post<ResetPasswordResponse>('/auth/password/reset-with-code', data);
  return res.data;
};

export const authApi = {
  register,
  login,
  sendResetCode,
  verifyResetCode,
  resetPassword,
};
