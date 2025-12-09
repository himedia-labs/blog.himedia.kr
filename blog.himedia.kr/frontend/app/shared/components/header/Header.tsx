'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CiLogin } from 'react-icons/ci';
import { useQueryClient } from '@tanstack/react-query';
import { CiBellOff, CiBellOn, CiMenuBurger, CiSearch, CiUser } from 'react-icons/ci';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useToast } from '@/app/shared/components/toast/toast';
import { useLogoutMutation } from '@/app/api/auth/auth.mutations';
import { useAuthStore } from '@/app/shared/store/authStore';

import styles from './Header.module.css';

import { HeaderProps, NavItem } from './Header.types';
import { HeaderConfig } from './Header.config';
import { handleLogout as createHandleLogout } from './Header.handlers';

const NAV_ITEMS: NavItem[] = [
  { label: '알림', Icon: CiBellOn },
  { label: '검색', Icon: CiSearch },
  { label: '로그인/프로필', isAuthDependent: true },
];

export default function Header({ initialIsLoggedIn }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();
  const [isBellOn, setIsBellOn] = useState(true);
  const { accessToken, isInitialized } = useAuthStore();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const { showToast } = useToast();

  // 특정 경로에서는 Header 숨김
  if (HeaderConfig.hidePaths.includes(pathname)) {
    return null;
  }

  /**
   * 로그인 상태 계산
   * @description 로그인 후 "/" 로 이동되었을때 header Icon 변경을 위함
   * - 초기화 전 (isInitialized = false): 서버에서 전달받은 initialIsLoggedIn 사용
   * - 초기화 후 (isInitialized = true): accessToken 존재 여부로 실시간 로그인 상태 확인
   */
  const isLoggedIn = isInitialized ? !!accessToken : initialIsLoggedIn;

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
