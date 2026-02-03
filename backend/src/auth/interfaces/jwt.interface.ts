import type { UserRole } from '@/auth/entities/user.entity';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
