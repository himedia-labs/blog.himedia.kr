import { IsEmail, IsString, Length, MaxLength, MinLength, Matches } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 인증번호 확인 후 새 비밀번호로 재설정 요청에 사용
export class ResetPasswordWithCodeDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: VALIDATION_MESSAGES.CODE_STRING })
  @Length(8, 8, { message: VALIDATION_MESSAGES.CODE_LENGTH })
  code!: string;

  @IsString({ message: VALIDATION_MESSAGES.NEW_PASSWORD_STRING })
  @MinLength(8, { message: VALIDATION_MESSAGES.NEW_PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: VALIDATION_MESSAGES.NEW_PASSWORD_MAX_LENGTH })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: VALIDATION_MESSAGES.PASSWORD_PATTERN,
  })
  newPassword!: string;
}
