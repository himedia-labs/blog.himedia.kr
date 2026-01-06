import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// 게시물 작성 버튼 클릭 핸들러 생성
export const createHandleCreatePost = (params: { router: AppRouterInstance; accessToken: string | null }) => {
  return () => {
    if (!params.accessToken) {
      params.router.push('/login?redirect=/posts/new');
      return;
    }
    params.router.push('/posts/new');
  };
};
