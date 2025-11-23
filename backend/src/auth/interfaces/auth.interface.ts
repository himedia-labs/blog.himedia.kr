import type { UserRole } from '../entities/user.entity';

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  course: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUserProfile;
}
