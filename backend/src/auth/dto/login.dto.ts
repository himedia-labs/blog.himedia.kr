import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 로그인
export class LoginDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: VALIDATION_MESSAGES.PASSWORD_STRING })
  @MinLength(8, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  password!: string;
}
