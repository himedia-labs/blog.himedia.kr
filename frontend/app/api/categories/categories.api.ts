import { axiosInstance } from '@/app/shared/network/axios.instance';
import type { CategoryListResponse } from '@/app/shared/types/post';

// 카테고리 목록 조회
const getCategories = async (): Promise<CategoryListResponse> => {
  const res = await axiosInstance.get<CategoryListResponse>('/categories');
  return res.data;
};

export const categoriesApi = {
  getCategories,
};
