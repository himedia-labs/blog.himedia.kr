'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/app/shared/store/authStore';

import type { ReactNode } from 'react';

type PrivateLayoutProps = {
  children: ReactNode;
};

/**
 * 비공개 라우트 레이아웃
 * @description 인증 상태를 확인해 비로그인 사용자를 로그인 페이지로 이동
 */
export default function PrivateLayout({ children }: PrivateLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { accessToken, isInitialized } = useAuthStore();

  // 현재 경로
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  // 인증 리다이렉트
  useEffect(() => {
    if (!isInitialized || accessToken) return;

    const loginParams = new URLSearchParams();
    loginParams.set('reason', 'auth');
    loginParams.set('redirect', currentPath);

    router.replace(`/login?${loginParams.toString()}`);
  }, [accessToken, currentPath, isInitialized, router]);

  // 초기화 대기
  if (!isInitialized) {
    return null;
  }

  // 비인증 대기
  if (!accessToken) {
    return null;
  }

  // 렌더링
  return <>{children}</>;
}
