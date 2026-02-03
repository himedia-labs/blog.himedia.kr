import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';

// 프로필 수정
export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: AUTH_VALIDATION_MESSAGES.NAME_STRING })
  @MaxLength(100, { message: AUTH_VALIDATION_MESSAGES.NAME_MAX_LENGTH })
  name?: string | null;

  @IsOptional()
  @IsString({ message: AUTH_VALIDATION_MESSAGES.PROFILE_HANDLE_STRING })
  @MaxLength(50, { message: AUTH_VALIDATION_MESSAGES.PROFILE_HANDLE_MAX_LENGTH })
  @Matches(/^[a-z0-9._-]+$/i, { message: AUTH_VALIDATION_MESSAGES.PROFILE_HANDLE_PATTERN })
  profileHandle?: string | null;
}
