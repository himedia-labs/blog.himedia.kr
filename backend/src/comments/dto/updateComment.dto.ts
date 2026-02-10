import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { COMMENT_VALIDATION_MESSAGES } from '@/constants/message/comment.messages';
import { MAX_COMMENT_CONTENT_LENGTH, normalizeCommentContent } from '@/comments/utils/comment-content.util';

// 댓글 수정
export class UpdateCommentDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? normalizeCommentContent(value) : value))
  @IsOptional()
  @IsString({ message: COMMENT_VALIDATION_MESSAGES.CONTENT_STRING })
  @MaxLength(MAX_COMMENT_CONTENT_LENGTH, { message: COMMENT_VALIDATION_MESSAGES.CONTENT_MAX_LENGTH })
  content?: string;
}
