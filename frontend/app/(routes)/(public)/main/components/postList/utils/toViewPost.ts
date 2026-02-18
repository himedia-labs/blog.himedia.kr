import { formatDate } from '@/app/(routes)/(public)/main/components/postList/utils/formatDate';
import { extractImageUrl } from '@/app/(routes)/(public)/main/components/postList/utils/extractImageUrl';
import { buildRelativeTime } from '@/app/(routes)/(public)/main/components/postList/utils/buildRelativeTime';
import { formatPostPreview } from '@/app/shared/utils/formatPostPreview.utils';

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
    content: formatPostPreview(item.content),
    imageUrl,
    authorId: item.author?.id ?? '',
    category: item.category?.name ?? 'ALL',
    tags: (item.tags ?? []).map(tag => tag.name).filter(tagName => tagName.trim().length > 0),
    authorName: item.author?.name ?? '알 수 없음',
    date: formatDate(item.publishedAt ?? item.createdAt),
    timeAgo: buildRelativeTime(item.publishedAt ?? item.createdAt),
    views: item.viewCount,
    shareCount: item.shareCount,
    likeCount: item.likeCount,
    commentCount: item.commentCount ?? 0,
    authorProfileImageUrl: item.author?.profileImageUrl ?? null,
  };
};
