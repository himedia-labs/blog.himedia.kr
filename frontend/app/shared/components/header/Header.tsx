'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CiLogin } from 'react-icons/ci';
import { useQueryClient } from '@tanstack/react-query';
import { CiBellOff, CiBellOn, CiMenuBurger, CiSearch, CiUser } from 'react-icons/ci';

import { authKeys } from '@/app/api/auth/auth.keys';
// import { useScroll } from '@/app/shared/hooks/useScroll';
import { useToast } from '@/app/shared/components/toast/toast';
import { useLogoutMutation } from '@/app/api/auth/auth.mutations';
import { useAuthStore } from '@/app/shared/store/authStore';

import { HeaderConfig } from './Header.config';
import { handleLogout as createHandleLogout } from './Header.handlers';

import styles from './Header.module.css';
import type { HeaderProps, NavItem } from './Header.types';

const NAV_ITEMS: NavItem[] = [
  { label: '알림', Icon: CiBellOn },
  { label: '검색', Icon: CiSearch },
  { label: '로그인/프로필', isAuthDependent: true },
];

/**
 * 공통 헤더
 * @description 로그인 상태에 따라 메뉴를 표시
 */
export default function Header({ initialIsLoggedIn }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();
  // const isScrolled = useScroll(0);
  const [isBellOn, setIsBellOn] = useState(true);
  const [initialLoginFlag, setInitialLoginFlag] = useState(initialIsLoggedIn);
  const { accessToken, isInitialized } = useAuthStore();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const { showToast } = useToast();

  // 로그인 상태
  // - initialLoginFlag: 로그인 후 리다이렉트 시 아이콘 변화가 없기에 필수
  // - accessToken: 새로고침 시 초기화된 상태 복구 용도
  const isLoggedIn = isInitialized ? !!accessToken : !!accessToken || initialLoginFlag;

  useEffect(() => {
    if (!isInitialized) return;
    if (!accessToken) {
      setInitialLoginFlag(false);
    }
  }, [isInitialized, accessToken]);

  // 특정 경로에서는 Header 숨김
  if (HeaderConfig.hidePaths.includes(pathname)) {
    return null;
  }

  // 알림 아이콘 토글 (on/off)
  const toggleBell = () => setIsBellOn(prev => !prev);

  // 로그아웃 핸들러
  const handleLogout = createHandleLogout({
    logoutMutation,
    clearAuth,
    queryClient,
    authKeys,
    showToast,
    router,
    onLogoutSuccess: () => setInitialLoginFlag(false),
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
            {NAV_ITEMS.map(item => {
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
    </header>
  );
}
