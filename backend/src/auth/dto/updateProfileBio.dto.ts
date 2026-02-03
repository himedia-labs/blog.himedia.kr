import { IsOptional, IsString, MaxLength } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';

// 자기소개 수정
export class UpdateProfileBioDto {
  @IsOptional()
  @IsString({ message: AUTH_VALIDATION_MESSAGES.PROFILE_BIO_STRING })
  @MaxLength(500, { message: AUTH_VALIDATION_MESSAGES.PROFILE_BIO_MAX_LENGTH })
  profileBio?: string | null;
}
