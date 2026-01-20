import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { POST_VALIDATION_MESSAGES } from '../../constants/message/post.messages';
import { PostStatus } from '../entities/post.entity';

export enum PostSortOption {
  CREATED_AT = 'createdAt',
  PUBLISHED_AT = 'publishedAt',
  VIEW_COUNT = 'viewCount',
  LIKE_COUNT = 'likeCount',
}

export const POST_FEED_OPTIONS = ['following'] as const;
export type PostFeedOption = (typeof POST_FEED_OPTIONS)[number];

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// 게시글 목록 조회 쿼리
export class ListPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: POST_VALIDATION_MESSAGES.PAGE_NUMBER })
  @Min(1, { message: POST_VALIDATION_MESSAGES.PAGE_MIN })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: POST_VALIDATION_MESSAGES.LIMIT_NUMBER })
  @Min(1, { message: POST_VALIDATION_MESSAGES.LIMIT_MIN })
  @Max(50, { message: POST_VALIDATION_MESSAGES.LIMIT_MAX })
  limit?: number;

  @IsOptional()
  @IsString({ message: POST_VALIDATION_MESSAGES.CATEGORY_ID_STRING })
  categoryId?: string;

  @IsOptional()
  @IsIn([PostStatus.DRAFT, PostStatus.PUBLISHED], { message: POST_VALIDATION_MESSAGES.POST_STATUS_ENUM })
  status?: PostStatus;

  @IsOptional()
  @IsIn(
    [PostSortOption.CREATED_AT, PostSortOption.PUBLISHED_AT, PostSortOption.VIEW_COUNT, PostSortOption.LIKE_COUNT],
    {
      message: POST_VALIDATION_MESSAGES.POST_SORT_ENUM,
    },
  )
  sort?: PostSortOption;

  @IsOptional()
  @IsIn([SortOrder.ASC, SortOrder.DESC], { message: POST_VALIDATION_MESSAGES.SORT_ORDER_ENUM })
  order?: SortOrder;

  @IsOptional()
  @IsIn(POST_FEED_OPTIONS, { message: POST_VALIDATION_MESSAGES.POST_FEED_ENUM })
  feed?: PostFeedOption;
}
