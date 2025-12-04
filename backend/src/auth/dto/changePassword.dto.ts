import { IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 로그인 후 비밀번호 변경
export class ChangePasswordDto {
  @IsString({ message: VALIDATION_MESSAGES.CURRENT_PASSWORD_STRING })
  @MinLength(8, { message: VALIDATION_MESSAGES.CURRENT_PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: VALIDATION_MESSAGES.CURRENT_PASSWORD_MAX_LENGTH })
  currentPassword!: string;

  @IsString({ message: VALIDATION_MESSAGES.NEW_PASSWORD_STRING })
  @MinLength(8, { message: VALIDATION_MESSAGES.NEW_PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: VALIDATION_MESSAGES.NEW_PASSWORD_MAX_LENGTH })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: VALIDATION_MESSAGES.PASSWORD_PATTERN,
  })
  newPassword!: string;
}
