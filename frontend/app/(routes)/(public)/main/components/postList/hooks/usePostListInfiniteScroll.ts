import type { RefObject } from 'react';

import { useInfiniteScrollObserver } from '@/app/shared/hooks/useInfiniteScrollObserver';

/**
 * 메인 포스트 무한 스크롤 훅
 * @description 센티넬 노출 시 다음 페이지를 요청
 */
export const usePostListInfiniteScroll = (params: {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  fetchNextPage: () => Promise<unknown>;
}) => {
  const { fetchNextPage, hasNextPage, sentinelRef, isFetchingNextPage } = params;

  useInfiniteScrollObserver({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    targetRef: sentinelRef,
    rootMargin: '200px',
  });
};
