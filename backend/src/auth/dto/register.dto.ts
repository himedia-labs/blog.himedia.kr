import {
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Equals,
  Matches,
} from 'class-validator';

import { UserRole } from '../entities/user.entity';
import { VALIDATION_MESSAGES } from '../../constants/message/dto.messages';

// 회원가입
export class RegisterDto {
  @IsString({ message: VALIDATION_MESSAGES.NAME_STRING })
  @MaxLength(100, { message: VALIDATION_MESSAGES.NAME_MAX_LENGTH })
  name!: string;

  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: VALIDATION_MESSAGES.PASSWORD_STRING })
  @MinLength(8, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: VALIDATION_MESSAGES.PASSWORD_PATTERN,
  })
  password!: string;

  @IsString({ message: VALIDATION_MESSAGES.PHONE_STRING })
  @MaxLength(20, { message: VALIDATION_MESSAGES.PHONE_MAX_LENGTH })
  phone!: string;

  @IsEnum(UserRole, { message: VALIDATION_MESSAGES.ROLE_ENUM })
  role!: UserRole;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COURSE_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.COURSE_MAX_LENGTH })
  course?: string | null;

  @IsBoolean({ message: VALIDATION_MESSAGES.PRIVACY_CONSENT_BOOLEAN })
  @Equals(true, { message: VALIDATION_MESSAGES.PRIVACY_CONSENT_REQUIRED })
  privacyConsent!: boolean;
}
