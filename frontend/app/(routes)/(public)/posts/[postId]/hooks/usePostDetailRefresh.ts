import { useEffect } from 'react';

import type { PostDetailRefreshParams } from '@/app/shared/types/post';

/**
 * 게시물 상세 리프레시 훅
 * @description 토큰 변경 시 상세/댓글 데이터를 갱신
 */
export const usePostDetailRefresh = ({
  accessToken,
  isInitialized,
  refetchComments,
  refetchPost,
}: PostDetailRefreshParams) => {
  // 토큰 리프레시
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    refetchPost().catch(() => null);
    refetchComments().catch(() => null);
  }, [accessToken, isInitialized, refetchComments, refetchPost]);
};
