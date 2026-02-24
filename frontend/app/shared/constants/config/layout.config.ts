import type { PathVisibilityConfig } from '@/app/shared/types/path';

/**
 * 레이아웃 공통 설정
 * @description Header/Footer 표시 여부 설정
 */
export const LayoutVisibilityConfig: PathVisibilityConfig = {
  hidePaths: ['/login', '/register', '/find-password', '/posts/new'],
  hidePrefixes: ['/posts/edit', '/admin'],
};
