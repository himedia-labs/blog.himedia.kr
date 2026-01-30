import { useMemo, useState } from 'react';

import { sortPostsByKey } from '@/app/(routes)/(private)/mypage/utils';

import type { ActivitySortKey } from '@/app/shared/types/mypage';
import type { MyCommentItem } from '@/app/shared/types/comment';
import type { PostListItem } from '@/app/shared/types/post';

/**
 * 마이페이지 활동 정렬 훅
 * @description 내 게시글/댓글 정렬 상태를 관리
 */
export const useActivitySort = (posts: PostListItem[], comments: MyCommentItem[]) => {
  // 정렬 상태
  const [sortKey, setSortKey] = useState<ActivitySortKey>('latest');

  // 게시글 정렬
  const sortedPosts = useMemo(() => {
    return sortPostsByKey(posts, sortKey);
  }, [posts, sortKey]);

  // 댓글 정렬
  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortKey === 'popular') {
      return list.sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          b.replyCount - a.replyCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments, sortKey]);

  // 정렬 변경
  const handleSortChange = (nextKey: ActivitySortKey) => setSortKey(nextKey);

  return {
    sortKey,
    sortedPosts,
    sortedComments,
    handleSortChange,
  };
};
