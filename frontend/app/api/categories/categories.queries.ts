import { useQuery } from '@tanstack/react-query';

import { categoriesApi } from './categories.api';
import { categoriesKeys } from './categories.keys';
import type { CategoryListResponse } from '@/app/shared/types/post';

// 카테고리 목록 조회 쿼리
export const useCategoriesQuery = () => {
  return useQuery<CategoryListResponse, Error>({
    queryKey: categoriesKeys.all,
    queryFn: categoriesApi.getCategories,
  });
};
