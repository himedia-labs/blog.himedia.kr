import { axiosInstance } from '@/app/shared/network/axios.instance';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SendResetCodeRequest,
  SendResetCodeResponse,
  UpdateProfileBioRequest,
  UpdateProfileBioResponse,
  UpdateProfileImageRequest,
  UpdateProfileImageResponse,
  PublicProfile,
  User,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
} from '@/app/shared/types/auth';

// 회원가입
const register = async (data: RegisterRequest): Promise<void> => {
  const res = await axiosInstance.post('/auth/register', data);
  return res.data;
};

// 로그인
const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await axiosInstance.post<AuthResponse>('/auth/login', data);
  return res.data;
};

// 비밀번호 찾기 - 코드 발송
const sendResetCode = async (data: SendResetCodeRequest): Promise<SendResetCodeResponse> => {
  const res = await axiosInstance.post<SendResetCodeResponse>('/auth/password/send-code', data);
  return res.data;
};

// 비밀번호 찾기 - 코드 검증
const verifyResetCode = async (data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> => {
  const res = await axiosInstance.post<VerifyResetCodeResponse>('/auth/password/verify-code', data);
  return res.data;
};

// 비밀번호 재설정
const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const res = await axiosInstance.post<ResetPasswordResponse>('/auth/password/reset-with-code', data);
  return res.data;
};

// 내 정보 조회
const getCurrentUser = async (): Promise<User> => {
  return axiosInstance.get<User>('/auth/me').then(res => res.data);
};

// 공개 프로필 조회
const getProfileByHandle = async (handle: string): Promise<PublicProfile> => {
  const encoded = encodeURIComponent(handle);
  return axiosInstance.get<PublicProfile>(`/auth/profile/${encoded}`).then(res => res.data);
};

// 자기소개 수정
const updateProfileBio = async (payload: UpdateProfileBioRequest): Promise<UpdateProfileBioResponse> => {
  const res = await axiosInstance.patch<UpdateProfileBioResponse>('/auth/me/profile-bio', payload);
  return res.data;
};

// 프로필 이미지 수정
const updateProfileImage = async (payload: UpdateProfileImageRequest): Promise<UpdateProfileImageResponse> => {
  const res = await axiosInstance.patch<UpdateProfileImageResponse>('/auth/me/profile-image', payload);
  return res.data;
};

// 로그아웃
const logout = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};

export const authApi = {
  register,
  login,
  sendResetCode,
  verifyResetCode,
  resetPassword,
  getCurrentUser,
  getProfileByHandle,
  updateProfileBio,
  updateProfileImage,
  logout,
};
