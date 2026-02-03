import type { User } from '@/auth/entities/user.entity';
import type { PasswordReset } from '@/auth/entities/passwordReset.entity';

export interface PasswordResetValidation {
  user: User;
  resetRecord: PasswordReset;
}
