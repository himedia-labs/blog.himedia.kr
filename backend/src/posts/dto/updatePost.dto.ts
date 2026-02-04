import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PostStatus } from '@/posts/entities/post.entity';
import { POST_VALIDATION_MESSAGES } from '@/constants/message/post.messages';

// 게시글 수정
export class UpdatePostDto {
  @IsOptional()
  @IsString({ message: POST_VALIDATION_MESSAGES.TITLE_STRING })
  @MaxLength(200, { message: POST_VALIDATION_MESSAGES.TITLE_MAX_LENGTH })
  title?: string;

  @IsOptional()
  @IsString({ message: POST_VALIDATION_MESSAGES.CONTENT_STRING })
  content?: string;

  @IsOptional()
  @IsString({ message: POST_VALIDATION_MESSAGES.CATEGORY_ID_STRING })
  categoryId?: string | null;

  @IsOptional()
  @IsString({ message: POST_VALIDATION_MESSAGES.THUMBNAIL_URL_STRING })
  @MaxLength(500, { message: POST_VALIDATION_MESSAGES.THUMBNAIL_URL_MAX_LENGTH })
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray({ message: POST_VALIDATION_MESSAGES.TAGS_ARRAY })
  @ArrayMaxSize(5, { message: POST_VALIDATION_MESSAGES.TAGS_MAX_COUNT })
  @IsString({ each: true, message: POST_VALIDATION_MESSAGES.TAG_STRING })
  @MaxLength(20, { each: true, message: POST_VALIDATION_MESSAGES.TAG_MAX_LENGTH })
  tags?: string[];

  @IsOptional()
  @IsIn([PostStatus.DRAFT, PostStatus.PUBLISHED], { message: POST_VALIDATION_MESSAGES.POST_STATUS_ENUM })
  status?: PostStatus;
}
