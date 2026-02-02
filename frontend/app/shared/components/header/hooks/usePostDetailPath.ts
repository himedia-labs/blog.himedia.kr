import { useMemo } from 'react';

import { HeaderConfig } from '@/app/shared/components/header/Header.config';

/**
 * 게시물 상세 경로
 * @description 상세 페이지 여부를 계산
 */
export const usePostDetailPath = (pathname: string | null) =>
  useMemo(() => {
    if (!pathname?.startsWith('/posts/')) return false;
    if (HeaderConfig.postDetailExcludeExactPaths.includes(pathname)) return false;

    return !HeaderConfig.postDetailExcludePrefixes.some(prefix => pathname.startsWith(prefix));
  }, [pathname]);
