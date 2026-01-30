import { formatDate } from '@/app/(routes)/(public)/main/components/postList/utils/formatDate';
import { buildSummary } from '@/app/(routes)/(public)/main/components/postList/utils/buildSummary';
import { extractImageUrl } from '@/app/(routes)/(public)/main/components/postList/utils/extractImageUrl';
import { buildRelativeTime } from '@/app/(routes)/(public)/main/components/postList/utils/buildRelativeTime';

import type { Post, PostListItem } from '@/app/shared/types/post';

/**
 * 화면용 포스트 변환
 * @description API 응답을 화면용 Post로 변환
 */
export const toViewPost = (item: PostListItem): Post => {
  const imageUrl = item.thumbnailUrl ?? extractImageUrl(item.content);
  return {
    id: item.id,
    title: item.title,
    summary: buildSummary(item.content),
    imageUrl,
    category: item.category?.name ?? 'ALL',
    date: formatDate(item.publishedAt ?? item.createdAt),
    timeAgo: buildRelativeTime(item.publishedAt ?? item.createdAt),
    views: item.viewCount,
    likeCount: item.likeCount,
    commentCount: item.commentCount ?? 0,
  };
};
