/**
 * auth.api.ts
 * auth.mutations.ts
 */

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'TRAINEE' | 'MENTOR' | 'INSTRUCTOR';
  course?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SendResetCodeRequest {
  email: string;
}

export interface SendResetCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
}

// auth.types.ts
export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}
