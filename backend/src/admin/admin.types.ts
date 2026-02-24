import type { Request } from 'express';
import type { UserRole } from '../auth/entities/user.entity';

export type AdminAuthRequest = Request & {
  user: {
    sub: string;
    role: UserRole;
  };
};
