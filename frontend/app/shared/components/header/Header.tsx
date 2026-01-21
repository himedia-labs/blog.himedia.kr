'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { CiBellOff, CiBellOn, CiLogin, CiMenuBurger, CiUser } from 'react-icons/ci';

import { authKeys } from '@/app/api/auth/auth.keys';
// import { useScroll } from '@/app/shared/hooks/useScroll';
import { useToast } from '@/app/shared/components/toast/toast';
import { useLogoutMutation } from '@/app/api/auth/auth.mutations';
import { useAuthStore } from '@/app/shared/store/authStore';

import { HeaderConfig } from './Header.config';
import { handleLogout as createHandleLogout } from './Header.handlers';
import { usePostDetailPath } from './hooks/usePostDetailPath';
import { useScrollProgress } from './hooks/useScrollProgress';

import styles from './Header.module.css';
import type { HeaderProps } from './Header.types';

/**
 * 공통 헤더
 * @description 로그인 상태에 따라 메뉴를 표시
 */
export default function Header({ initialIsLoggedIn }: HeaderProps) {
  // 라우터 훅
  const router = useRouter();
  const pathname = usePathname();

  // UI 상태
  const [isBellOn, setIsBellOn] = useState(true);

  // 요청 훅
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();

  // 인증 상태
  const { accessToken, isInitialized } = useAuthStore();
  const clearAuth = useAuthStore(state => state.clearAuth);

  // 알림 유틸
  const { showToast } = useToast();

  // 로그인 상태
  // - initialIsLoggedIn: 서버 쿠키 기반 초기 상태
  // - accessToken: 클라이언트 토큰 상태
  const isLoggedIn = isInitialized ? !!accessToken : !!accessToken || initialIsLoggedIn;

  // 파생 상태
  const isPostDetail = usePostDetailPath(pathname);
  const scrollProgress = useScrollProgress(isPostDetail);

  // 특정 경로에서는 Header 숨김
  if (HeaderConfig.hidePaths.includes(pathname)) {
    return null;
  }

  // 알림 토글
  const toggleBell = () => setIsBellOn(prev => !prev);

  // 로그아웃 핸들러
  const handleLogout = createHandleLogout({
    logoutMutation,
    clearAuth,
    queryClient,
    authKeys,
    showToast,
    router,
    onLogoutSuccess: () => null,
  });

  return (
    <header className={styles.container}>
      <div className={styles.wrap}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>
            <Image src="/icon/logo.png" alt="하이미디어아카데미 로고" fill priority sizes="90px" draggable={false} />
          </span>
          <span className={styles.logoText}>
            하이미디어커뮤니티
            <span className={styles.logoSub}>HIMEDIA COMMUNITY</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="주요 메뉴">
          <ul>
            {HeaderConfig.navItems.map(item => {
              if (item.isAuthDependent) {
                const Icon = isLoggedIn ? CiLogin : CiUser;
                const label = isLoggedIn ? '로그아웃' : '로그인';

                return (
                  <li key={item.label}>
                    {isLoggedIn ? (
                      <button
                        type="button"
                        className={`${styles.navLink} ${styles.navButton}`}
                        aria-label={label}
                        title={label}
                        onClick={handleLogout}
                      >
                        <Icon aria-hidden="true" focusable="false" />
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className={pathname === '/login' ? `${styles.navLink} ${styles.navActive}` : styles.navLink}
                        aria-label={label}
                        title={label}
                        aria-current={pathname === '/login' ? 'page' : undefined}
                      >
                        <Icon aria-hidden="true" focusable="false" />
                      </Link>
                    )}
                  </li>
                );
              }

              const isLink = Boolean(item.href);
              const isBellItem = item.label === '알림';
              const IconComponent = isBellItem ? (isBellOn ? CiBellOn : CiBellOff) : item.Icon!;

              return (
                <li key={item.label}>
                  {isLink ? (
                    <Link
                      href={item.href as string}
                      className={styles.navLink}
                      aria-label={item.label}
                      title={item.label}
                      aria-current={undefined}
                    >
                      <IconComponent aria-hidden="true" focusable="false" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.navLink} ${styles.navButton}`}
                      aria-label={item.label}
                      title={item.label}
                      onClick={isBellItem ? toggleBell : undefined}
                    >
                      <IconComponent aria-hidden="true" focusable="false" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <button className={styles.menuButton} aria-label="메뉴 열기">
          <CiMenuBurger />
        </button>
      </div>
      {isPostDetail ? (
        <div className={styles.progressBar} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${scrollProgress}%` }} />
        </div>
      ) : null}
    </header>
  );
}
