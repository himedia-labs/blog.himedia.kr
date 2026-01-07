import { useQuery } from '@tanstack/react-query';

import { postsApi } from './posts.api';
import { postsKeys } from './posts.keys';
import type { PostDetailResponse, PostListQuery, PostListResponse } from '@/app/shared/types/post';

type QueryOptions = {
  enabled?: boolean;
};

export const usePostsQuery = (params?: PostListQuery, options?: QueryOptions) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.list(params),
    queryFn: () => postsApi.getPosts(params),
    enabled: options?.enabled ?? true,
  });
};

export const useDraftsQuery = (params?: PostListQuery, options?: QueryOptions) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.drafts(params),
    queryFn: () => postsApi.getDrafts(params),
    enabled: options?.enabled ?? true,
  });
};

export const useDraftDetailQuery = (postId?: string, options?: QueryOptions) => {
  return useQuery<PostDetailResponse, Error>({
    queryKey: postsKeys.draft(postId),
    queryFn: () => postsApi.getDraftDetail(postId ?? ''),
    enabled: Boolean(postId) && (options?.enabled ?? true),
  });
};
