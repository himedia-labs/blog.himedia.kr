import type { ActivitySortKey } from '@/app/shared/types/mypage';
import type { PostListItem } from '@/app/shared/types/post';

/**
 * 게시글 정렬
 * @description 최신/인기 기준으로 정렬
 */
export const sortPostsByKey = (posts: PostListItem[], sortKey: ActivitySortKey) => {
  const list = [...posts];
  if (sortKey === 'popular') {
    return list.sort((a, b) => b.likeCount - a.likeCount || b.viewCount - a.viewCount);
  }
  return list.sort(
    (a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
};
