import type { PostListQuery } from '@/app/shared/types/post';

export const postsKeys = {
  all: ['posts'] as const,
  list: (params?: PostListQuery) => [...postsKeys.all, 'list', params ?? {}] as const,
};
