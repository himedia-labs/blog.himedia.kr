import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';
import { PASSWORD_VALIDATION_MESSAGES } from '@/constants/message/password.messages';

// 로그인
export class LoginDto {
  @IsEmail({}, { message: AUTH_VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_STRING })
  @MinLength(8, { message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  password!: string;
}
