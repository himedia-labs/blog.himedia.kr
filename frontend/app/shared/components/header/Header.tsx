'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { FaUser } from 'react-icons/fa6';
import { CiChat1, CiFileOn, CiHeart, CiLogin, CiLogout, CiMenuBurger, CiUser } from 'react-icons/ci';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useLogoutMutation } from '@/app/api/auth/auth.mutations';
import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';

import { useAuthStore } from '@/app/shared/store/authStore';

import { useToast } from '@/app/shared/components/toast/toast';
import { usePathVisibility } from '@/app/shared/hooks/usePathVisibility';
import { LayoutVisibilityConfig } from '@/app/shared/constants/config/layout.config';
import { formatNotificationTime, getNotificationIcon } from '@/app/shared/utils/notification.utils';

import { HeaderConfig } from '@/app/shared/components/header/Header.config';
import { useProfileMenu } from '@/app/shared/components/header/hooks/useProfileMenu';
import { useScrollProgress } from '@/app/shared/components/header/hooks/useScrollProgress';
import { usePostDetailPath } from '@/app/shared/components/header/hooks/usePostDetailPath';
import { useNotificationMenu } from '@/app/shared/components/header/hooks/useNotificationMenu';
import { handleLogout as createHandleLogout } from '@/app/shared/components/header/handlers/logout.handlers';

import styles from '@/app/shared/components/header/Header.module.css';

import type { HeaderProps } from '@/app/shared/types/header';

/**
 * 공통 헤더
 * @description 로그인 상태에 따라 메뉴를 표시
 */
export default function Header({ initialIsLoggedIn }: HeaderProps) {
  // 라우터
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // 인증 상태
  const { accessToken, isInitialized } = useAuthStore();
  const clearAuth = useAuthStore(state => state.clearAuth);

  // 로그인 상태 (초기화 전: 서버 쿠키 기반, 초기화 후: 클라이언트 토큰 기반)
  const isLoggedIn = isInitialized ? !!accessToken : !!accessToken || initialIsLoggedIn;

  // 데이터
  const { data: currentUser } = useCurrentUserQuery();

  // 훅
  const { showToast } = useToast();
  const logoutMutation = useLogoutMutation();
  const isVisible = usePathVisibility(LayoutVisibilityConfig);
  const isPostDetail = usePostDetailPath(pathname);
  const scrollProgress = useScrollProgress(isPostDetail, '[data-scroll-progress-end="post-content"]');

  // 프로필 메뉴
  const { profileRef, isProfileOpen, isProfileVisible, toggleProfileMenu, closeProfileMenu } =
    useProfileMenu(isLoggedIn);

  // 알림 메뉴
  const {
    notificationRef,
    isNotificationOpen,
    isNotificationVisible,
    notificationTab,
    setNotificationTab,
    unreadCount,
    hasUnread,
    visibleNotifications,
    hasNotifications,
    notificationTabIndex,
    filteredNotifications,
    handleNotificationClick,
    handleMarkAllRead,
    toggleNotifications,
  } = useNotificationMenu({ isLoggedIn, router });

  // 메뉴 토글 핸들러
  const handleToggleNotifications = () => toggleNotifications(closeProfileMenu);
  const handleToggleProfile = () => toggleProfileMenu(() => {});

  // 특정 경로에서는 Header 숨김
  if (!isVisible) return null;

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
                const Icon = isLoggedIn ? FaUser : CiLogin;
                const label = isLoggedIn ? '프로필' : '로그인';

                return (
                  <li key={item.label}>
                    {isLoggedIn ? (
                      <div className={styles.profileWrapper} ref={profileRef}>
                        <button
                          type="button"
                          className={`${styles.navLink} ${styles.navButton} ${styles.profileIconButton}`}
                          aria-label={label}
                          aria-expanded={isProfileOpen}
                          aria-haspopup="menu"
                          title={label}
                          onClick={handleToggleProfile}
                        >
                          {currentUser?.profileImageUrl ? (
                            <img className={styles.profileIconImage} src={currentUser.profileImageUrl} alt="" />
                          ) : (
                            <Icon aria-hidden="true" focusable="false" />
                          )}
                        </button>
                        {isProfileVisible ? (
                          <div
                            className={`${styles.profileMenu} ${
                              isProfileOpen ? styles.dropdownOpen : styles.dropdownClose
                            }`}
                            role="menu"
                          >
                            <Link
                              href="/mypage"
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={closeProfileMenu}
                            >
                              <CiUser aria-hidden="true" />내 정보
                            </Link>
                            <div className={styles.profileDivider} aria-hidden="true" />
                            <Link
                              href="/mypage?tab=posts"
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={closeProfileMenu}
                            >
                              <CiFileOn aria-hidden="true" />내 블로그
                            </Link>
                            <Link
                              href="/mypage?tab=comments"
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={closeProfileMenu}
                            >
                              <CiChat1 aria-hidden="true" />
                              남긴 댓글
                            </Link>
                            <Link
                              href="/mypage?tab=likes"
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={closeProfileMenu}
                            >
                              <CiHeart aria-hidden="true" />
                              좋아한 포스트
                            </Link>
                            <div className={styles.profileDivider} aria-hidden="true" />
                            <button
                              type="button"
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={() => {
                                closeProfileMenu();
                                handleLogout();
                              }}
                            >
                              <CiLogout aria-hidden="true" />
                              로그아웃
                            </button>
                          </div>
                        ) : null}
                      </div>
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
              const IconComponent = item.Icon!;

              return (
                <li key={item.label}>
                  {isBellItem ? (
                    <div className={styles.notificationWrapper} ref={notificationRef}>
                      <button
                        type="button"
                        className={`${styles.navLink} ${styles.navButton}`}
                        aria-label={item.label}
                        aria-expanded={isNotificationOpen}
                        aria-haspopup="menu"
                        title={item.label}
                        onClick={handleToggleNotifications}
                      >
                        <IconComponent aria-hidden="true" focusable="false" />
                        {hasUnread ? (
                          <span className={styles.notificationBadge} aria-label={`읽지 않은 알림 ${unreadCount}개`}>
                            <span className={styles.notificationBadgeText}>{unreadCount}</span>
                          </span>
                        ) : null}
                      </button>
                      {isNotificationVisible ? (
                        <div
                          className={`${styles.notificationMenu} ${
                            isNotificationOpen ? styles.dropdownOpen : styles.dropdownClose
                          }`}
                          role="menu"
                        >
                          <div className={styles.notificationHeader}>
                            <div className={styles.notificationHeaderText}>
                              <span className={styles.notificationTitle}>알림 센터</span>
                              <span className={styles.notificationSubtitle}>내 활동 알림을 확인해요</span>
                            </div>
                            <button
                              type="button"
                              className={styles.notificationAllButton}
                              onClick={handleMarkAllRead}
                              disabled={!hasUnread}
                            >
                              전체 읽음
                            </button>
                          </div>
                          <div className={styles.notificationTabs} role="tablist" aria-label="알림 분류">
                            <button
                              type="button"
                              role="tab"
                              aria-selected={notificationTab === 'today'}
                              className={
                                notificationTab === 'today'
                                  ? `${styles.notificationTab} ${styles.notificationTabActive}`
                                  : styles.notificationTab
                              }
                              onClick={() => setNotificationTab('today')}
                            >
                              오늘
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={notificationTab === 'week'}
                              className={
                                notificationTab === 'week'
                                  ? `${styles.notificationTab} ${styles.notificationTabActive}`
                                  : styles.notificationTab
                              }
                              onClick={() => setNotificationTab('week')}
                            >
                              이번 주
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={notificationTab === 'earlier'}
                              className={
                                notificationTab === 'earlier'
                                  ? `${styles.notificationTab} ${styles.notificationTabActive}`
                                  : styles.notificationTab
                              }
                              onClick={() => setNotificationTab('earlier')}
                            >
                              이전
                            </button>
                            <span
                              className={styles.notificationTabIndicator}
                              aria-hidden="true"
                              style={{ transform: `translateX(${notificationTabIndex * 100}%)` }}
                            />
                          </div>
                          <ul className={styles.notificationList}>
                            {hasNotifications ? (
                              visibleNotifications.map((notification, index) => {
                                const Icon = getNotificationIcon(notification.type);
                                return (
                                  <li key={notification.id}>
                                    <button
                                      type="button"
                                      className={`${styles.notificationItem} ${
                                        notification.isRead ? '' : styles.notificationItemUnread
                                      }`}
                                      onClick={() =>
                                        handleNotificationClick(notification.id, notification.href, notification.isRead)
                                      }
                                    >
                                      <span className={styles.notificationIconBox}>
                                        <Icon aria-hidden="true" />
                                      </span>
                                      <span className={styles.notificationContent}>
                                        <span className={styles.notificationTitleRow}>
                                          {!notification.isRead ? (
                                            <span className={styles.notificationDot} aria-hidden="true" />
                                          ) : null}
                                          <span className={styles.notificationItemTitle}>{notification.title}</span>
                                        </span>
                                        <span className={styles.notificationMessage}>{notification.description}</span>
                                      </span>
                                      <span className={styles.notificationTime}>
                                        {formatNotificationTime(notification.createdAtMs)}
                                      </span>
                                    </button>
                                    {index < visibleNotifications.length - 1 ? (
                                      <div className={styles.notificationDivider} aria-hidden="true" />
                                    ) : null}
                                  </li>
                                );
                              })
                            ) : (
                              <li className={styles.notificationEmpty}>알림이 없어요.</li>
                            )}
                          </ul>
                          {filteredNotifications.length > 3 ? (
                            <Link href="/" className={styles.notificationFooterButton}>
                              전체 알림 보기
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : isLink ? (
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
                      onClick={isBellItem ? handleToggleNotifications : undefined}
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
