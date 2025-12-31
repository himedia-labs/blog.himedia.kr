import { useQuery } from '@tanstack/react-query';

import { postsApi } from './posts.api';
import { postsKeys } from './posts.keys';
import type { PostListQuery, PostListResponse } from '@/app/shared/types/post';

export const usePostsQuery = (params?: PostListQuery) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.list(params),
    queryFn: () => postsApi.getPosts(params),
  });
};
