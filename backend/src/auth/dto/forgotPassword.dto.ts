import { IsEmail, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 비밀번호 찾기
export class ForgotPasswordDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;
}
