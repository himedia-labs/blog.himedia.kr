import { useEffect, type RefObject } from 'react';

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
  // 무한 스크롤
  useEffect(() => {
    // 존재/상태 확인
    const target = params.sentinelRef.current;
    if (!target || !params.hasNextPage) return;

    // 옵저버 연결
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting || params.isFetchingNextPage) return;
        params.fetchNextPage();
      },
      { rootMargin: '200px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [params.fetchNextPage, params.hasNextPage, params.isFetchingNextPage, params.sentinelRef]);
};
