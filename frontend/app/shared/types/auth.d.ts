// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR';
  phone: string;
  course?: string | null;
  profileBio?: string | null;
}

// Auth Response
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Register Request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR';
  course?: string;
  privacyConsent: boolean;
}

export interface UpdateProfileBioRequest {
  profileBio?: string | null;
}

export type UpdateProfileBioResponse = User;


// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Password Reset - Send Code
export interface SendResetCodeRequest {
  email: string;
}

export interface SendResetCodeResponse {
  success: boolean;
  message: string;
}

// Password Reset - Verify Code
export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
}

// Password Reset - Reset Password
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Find Password Page
export type AuthStep = 'verify' | 'password';
