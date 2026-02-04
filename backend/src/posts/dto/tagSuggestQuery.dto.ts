import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { TAG_VALIDATION_MESSAGES } from '@/constants/message/tag.messages';

// 태그 자동완성 쿼리
export class TagSuggestQueryDto {
  @IsOptional()
  @IsString({ message: TAG_VALIDATION_MESSAGES.QUERY_STRING })
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: TAG_VALIDATION_MESSAGES.LIMIT_NUMBER })
  @Min(1, { message: TAG_VALIDATION_MESSAGES.LIMIT_MIN })
  @Max(20, { message: TAG_VALIDATION_MESSAGES.LIMIT_MAX })
  limit?: number;
}
