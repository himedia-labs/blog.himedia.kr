import { IsEmail, IsString, Length, MaxLength, MinLength, Matches } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';
import { PASSWORD_VALIDATION_MESSAGES } from '@/constants/message/password.messages';

// 인증번호 확인 후 새 비밀번호로 재설정 요청에 사용
export class ResetPasswordWithCodeDto {
  @IsEmail({}, { message: AUTH_VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: PASSWORD_VALIDATION_MESSAGES.CODE_STRING })
  @Length(8, 8, { message: PASSWORD_VALIDATION_MESSAGES.CODE_LENGTH })
  code!: string;

  @IsString({ message: PASSWORD_VALIDATION_MESSAGES.NEW_PASSWORD_STRING })
  @MinLength(8, { message: PASSWORD_VALIDATION_MESSAGES.NEW_PASSWORD_MIN_LENGTH })
  @MaxLength(32, { message: PASSWORD_VALIDATION_MESSAGES.NEW_PASSWORD_MAX_LENGTH })
  @Matches(
    /^(?!.*\s)(?!.*(.)\1\1)(?=.{8,32}$)(?:(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[@$!%*?&])|(?=.*\d)(?=.*[@$!%*?&]))[A-Za-z\d@$!%*?&]+$/,
    {
      message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_PATTERN,
    },
  )
  newPassword!: string;
}
