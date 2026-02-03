import { IsOptional, IsString, MaxLength } from 'class-validator';

import { AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';

// 프로필 이미지 수정
export class UpdateProfileImageDto {
  @IsOptional()
  @IsString({ message: AUTH_VALIDATION_MESSAGES.PROFILE_IMAGE_URL_STRING })
  @MaxLength(500, { message: AUTH_VALIDATION_MESSAGES.PROFILE_IMAGE_URL_MAX_LENGTH })
  profileImageUrl?: string | null;
}
