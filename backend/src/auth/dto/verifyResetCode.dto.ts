import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 이메일로 받은 인증번호 검증
export class VerifyResetCodeDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: VALIDATION_MESSAGES.CODE_STRING })
  @Length(8, 8, { message: VALIDATION_MESSAGES.CODE_LENGTH })
  code!: string;
}
