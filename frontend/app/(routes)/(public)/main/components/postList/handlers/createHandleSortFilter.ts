import type { SortFilter } from '@/app/shared/types/post';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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
