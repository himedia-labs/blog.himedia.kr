import type { PostListQuery } from '@/app/shared/types/post';

// 게시글 쿼리 키
export const postsKeys = {
  all: ['posts'] as const,
  list: (params?: PostListQuery) => [...postsKeys.all, 'list', params ?? {}] as const,
  infinite: (params?: PostListQuery) => [...postsKeys.all, 'infinite', params ?? {}] as const,
  detail: (postId?: string) => [...postsKeys.all, 'detail', postId ?? ''] as const,
  drafts: (params?: PostListQuery) => [...postsKeys.all, 'drafts', params ?? {}] as const,
  draft: (postId?: string) => [...postsKeys.all, 'draft', postId ?? ''] as const,
  liked: (params?: PostListQuery) => [...postsKeys.all, 'liked', params ?? {}] as const,
};
