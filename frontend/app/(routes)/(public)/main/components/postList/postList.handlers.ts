import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { SortFilter } from '@/app/shared/types/post';

/**
 * 게시물 작성 버튼 핸들러
 * @description 게시물 작성 페이지로 이동
 */
export const createHandleCreatePost = (params: { router: AppRouterInstance }) => {
  return () => {
    params.router.push('/posts/new');
  };
};

/**
 * 정렬 필터 핸들러
 * @description 로그인 필요 필터는 로그인 안내 후 이동
 */
export const createHandleSortFilter = (params: {
  accessToken: string | null;
  router: AppRouterInstance;
  setSortFilter: (value: SortFilter) => void;
}) => {
  return (nextFilter: SortFilter) => {
    if (nextFilter === 'following' && !params.accessToken) {
      params.router.push('/login?reason=auth');
      return;
    }

    params.setSortFilter(nextFilter);
  };
};
