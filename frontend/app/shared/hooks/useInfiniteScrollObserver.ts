'use client';

import { useEffect, type RefObject } from 'react';

/**
 * 공용 무한 스크롤 옵저버 훅
 * @description 센티넬 노출 시 다음 페이지 요청을 트리거
 */
export const useInfiniteScrollObserver = (params: {
  enabled?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  targetRef: RefObject<HTMLDivElement | null>;
  fetchNextPage: () => Promise<unknown>;
  rootMargin?: string;
}) => {
  const {
    enabled = true,
    rootMargin = '0px',
    fetchNextPage,
    hasNextPage,
    targetRef,
    isFetchingNextPage,
  } = params;

  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry?.isIntersecting || isFetchingNextPage) return;
        void fetchNextPage();
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage, rootMargin, targetRef]);
};
