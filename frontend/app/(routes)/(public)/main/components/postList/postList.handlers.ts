import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 게시물 작성 버튼 핸들러
 * @description 게시물 작성 페이지로 이동
 */
export const createHandleCreatePost = (params: { router: AppRouterInstance }) => {
  return () => {
    params.router.push('/posts/new');
  };
};
