import { useQuery } from '@tanstack/react-query';

import { categoriesApi } from '@/app/api/categories/categories.api';
import { categoriesKeys } from '@/app/api/categories/categories.keys';

import type { CategoryListResponse } from '@/app/shared/types/post';

// 카테고리 목록 조회 쿼리
export const useCategoriesQuery = () => {
  return useQuery<CategoryListResponse, Error>({
    queryKey: categoriesKeys.all,
    queryFn: categoriesApi.getCategories,
    placeholderData: previousData => previousData,
  });
};
