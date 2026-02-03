import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Equals,
  Matches,
} from 'class-validator';

import { PHONE_CONFIG } from '@/constants/config/phone.config';
import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';
import { PASSWORD_VALIDATION_MESSAGES } from '@/constants/message/password.messages';

import { UserRole } from '@/auth/entities/user.entity';

// 회원가입
export class RegisterDto {
  @IsString({ message: AUTH_VALIDATION_MESSAGES.NAME_STRING })
  @MaxLength(100, { message: AUTH_VALIDATION_MESSAGES.NAME_MAX_LENGTH })
  name!: string;

  @IsEmail({}, { message: AUTH_VALIDATION_MESSAGES.EMAIL_FORMAT })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.EMAIL_MAX_LENGTH })
  email!: string;

  @IsString({ message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_STRING })
  @MinLength(8, { message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(255, { message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: PASSWORD_VALIDATION_MESSAGES.PASSWORD_PATTERN,
  })
  password!: string;

  @IsString({ message: AUTH_VALIDATION_MESSAGES.PHONE_STRING })
  @MaxLength(PHONE_CONFIG.MAX_LENGTH, { message: AUTH_VALIDATION_MESSAGES.PHONE_MAX_LENGTH })
  phone!: string;

  @IsDateString({}, { message: AUTH_VALIDATION_MESSAGES.BIRTH_DATE_FORMAT })
  birthDate!: string;

  @IsIn([UserRole.TRAINEE, UserRole.GRADUATE, UserRole.MENTOR, UserRole.INSTRUCTOR], {
    message: AUTH_VALIDATION_MESSAGES.ROLE_ENUM,
  })
  role!: UserRole;

  @IsOptional()
  @IsString({ message: AUTH_VALIDATION_MESSAGES.COURSE_STRING })
  @MaxLength(255, { message: AUTH_VALIDATION_MESSAGES.COURSE_MAX_LENGTH })
  course?: string | null;

  @IsBoolean({ message: AUTH_VALIDATION_MESSAGES.PRIVACY_CONSENT_BOOLEAN })
  @Equals(true, { message: AUTH_VALIDATION_MESSAGES.PRIVACY_CONSENT_REQUIRED })
  privacyConsent!: boolean;
}
