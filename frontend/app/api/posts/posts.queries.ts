import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { postsApi } from '@/app/api/posts/posts.api';
import { postsKeys } from '@/app/api/posts/posts.keys';

import type { PostDetailResponse, PostListQuery, PostListResponse, PostsQueryOptions } from '@/app/shared/types/post';

// 게시글 무한 리스트 조회
export const useInfinitePostsQuery = (params?: PostListQuery, options?: PostsQueryOptions) => {
  return useInfiniteQuery<PostListResponse, Error>({
    queryKey: postsKeys.infinite(params),
    queryFn: ({ pageParam }) => postsApi.getPosts({ ...params, page: pageParam as number }),
    enabled: options?.enabled ?? true,
    placeholderData: previousData => previousData,
    getNextPageParam: lastPage => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
};

// 게시글 목록 조회
export const usePostsQuery = (params?: PostListQuery, options?: PostsQueryOptions) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.list(params),
    queryFn: () => postsApi.getPosts(params),
    enabled: options?.enabled ?? true,
    placeholderData: previousData => previousData,
  });
};

// 좋아요한 게시글 목록 조회
export const useLikedPostsQuery = (params?: PostListQuery, options?: PostsQueryOptions) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.liked(params),
    queryFn: () => postsApi.getLikedPosts(params),
    enabled: options?.enabled ?? true,
    placeholderData: previousData => previousData,
  });
};

// 임시저장 목록 조회
export const useDraftsQuery = (params?: PostListQuery, options?: PostsQueryOptions) => {
  return useQuery<PostListResponse, Error>({
    queryKey: postsKeys.drafts(params),
    queryFn: () => postsApi.getDrafts(params),
    enabled: options?.enabled ?? true,
  });
};

// 임시저장 상세 조회
export const useDraftDetailQuery = (postId?: string, options?: PostsQueryOptions) => {
  return useQuery<PostDetailResponse, Error>({
    queryKey: postsKeys.draft(postId),
    queryFn: () => postsApi.getDraftDetail(postId ?? ''),
    enabled: Boolean(postId) && (options?.enabled ?? true),
  });
};

// 게시글 상세 조회
export const usePostDetailQuery = (postId?: string, options?: PostsQueryOptions) => {
  return useQuery<PostDetailResponse, Error>({
    queryKey: postsKeys.detail(postId),
    queryFn: () => postsApi.getPostDetail(postId ?? ''),
    enabled: Boolean(postId) && (options?.enabled ?? true),
  });
};
