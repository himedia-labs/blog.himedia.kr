import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';
import { PASSWORD_VALIDATION_MESSAGES } from '@/constants/message/password.messages';

// 이메일로 받은 인증번호 검증
export class VerifyResetCodeDto {
  @IsEmail({}, { message: AUTH_VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: PASSWORD_VALIDATION_MESSAGES.CODE_STRING })
  @Length(8, 8, { message: PASSWORD_VALIDATION_MESSAGES.CODE_LENGTH })
  code!: string;
}
