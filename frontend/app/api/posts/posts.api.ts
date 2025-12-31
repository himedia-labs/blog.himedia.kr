import { axiosInstance } from '@/app/shared/network/axios.instance';
import type { PostListQuery, PostListResponse } from '@/app/shared/types/post';

const getPosts = async (params?: PostListQuery): Promise<PostListResponse> => {
  const res = await axiosInstance.get<PostListResponse>('/posts', { params });
  return res.data;
};

export const postsApi = {
  getPosts,
};
