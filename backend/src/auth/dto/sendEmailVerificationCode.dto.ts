import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';

export type EmailVerificationPurpose = 'register' | 'account-change';

// 이메일 인증 코드 발송
export class SendEmailVerificationCodeDto {
  @IsEmail({}, { message: AUTH_VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsOptional()
  @IsIn(['register', 'account-change'])
  purpose?: EmailVerificationPurpose;
}
