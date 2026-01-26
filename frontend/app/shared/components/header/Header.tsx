'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { CiUser, CiFileOn, CiLogin, CiLogout, CiMenuBurger } from 'react-icons/ci';
import { FaUser } from 'react-icons/fa6';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { notificationsKeys } from '@/app/api/notifications/notifications.keys';
import {
  useMarkNotificationReadMutation,
  useMarkNotificationsReadAllMutation,
} from '@/app/api/notifications/notifications.mutations';
import { useNotificationsQuery } from '@/app/api/notifications/notifications.queries';
// import { useScroll } from '@/app/shared/hooks/useScroll';
import { useToast } from '@/app/shared/components/toast/toast';
import { useLogoutMutation } from '@/app/api/auth/auth.mutations';
import { useAuthStore } from '@/app/shared/store/authStore';

import { HeaderConfig } from './Header.config';
import { handleLogout as createHandleLogout } from './Header.handlers';
import { usePostDetailPath } from './hooks/usePostDetailPath';
import { useScrollProgress } from './hooks/useScrollProgress';

import styles from './Header.module.css';
import type { NotificationListResponse, NotificationType } from '@/app/shared/types/notification';
import type { HeaderProps } from './Header.types';

const getNotificationIcon = (type: NotificationType) => {
  if (type === 'POST_COMMENT' || type === 'COMMENT_REPLY') return FiMessageCircle;
  return FiHeart;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getNotificationSection = (createdAtMs: number): 'today' | 'week' | 'earlier' => {
  const now = new Date();
  const createdAt = new Date(createdAtMs);
  const isSameDate =
    now.getFullYear() === createdAt.getFullYear() &&
    now.getMonth() === createdAt.getMonth() &&
    now.getDate() === createdAt.getDate();

  if (isSameDate) return 'today';
  if (Date.now() - createdAtMs < 7 * DAY_MS) return 'week';
  return 'earlier';
};

const formatNotificationTime = (createdAtMs: number) => {
  const diffMs = Math.max(Date.now() - createdAtMs, 0);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const date = new Date(createdAtMs);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
};

/**
 * 공통 헤더
 * @description 로그인 상태에 따라 메뉴를 표시
 */
export default function Header({ initialIsLoggedIn }: HeaderProps) {
  // 라우터 훅
  const router = useRouter();
  const pathname = usePathname();

  // UI 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'today' | 'week' | 'earlier'>('today');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // UI 참조
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // 요청 훅
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkNotificationsReadAllMutation();

  // 인증 상태
  const { accessToken, isInitialized } = useAuthStore();
  const clearAuth = useAuthStore(state => state.clearAuth);

  // 알림 유틸
  const { showToast } = useToast();

  // 로그인 상태
  // - initialIsLoggedIn: 서버 쿠키 기반 초기 상태
  // - accessToken: 클라이언트 토큰 상태
  const isLoggedIn = isInitialized ? !!accessToken : !!accessToken || initialIsLoggedIn;

  const { data: currentUser } = useCurrentUserQuery();

  const { data: notificationsData } = useNotificationsQuery({ enabled: isLoggedIn });

  // 파생 상태
  const isPostDetail = usePostDetailPath(pathname);
  const scrollProgress = useScrollProgress(isPostDetail);

  // 알림 상태
  const notifications = notificationsData?.items ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;
  const profileHandle = currentUser?.profileHandle ?? currentUser?.email?.split('@')[0] ?? '';
  const profileLink = profileHandle ? `/@${profileHandle}` : '/mypage';
  const filteredNotifications = useMemo(
    () =>
      notifications
        .filter(item => getNotificationSection(item.createdAtMs) === notificationTab)
        .sort((a, b) => b.createdAtMs - a.createdAtMs),
    [notificationTab, notifications],
  );
  const visibleNotifications = filteredNotifications.slice(0, 3);
  const hasNotifications = filteredNotifications.length > 0;
  const notificationTabIndex = notificationTab === 'today' ? 0 : notificationTab === 'week' ? 1 : 2;

  // 알림 핸들러
  const updateNotificationRead = (id: string) => {
    queryClient.setQueryData(notificationsKeys.list(), (old: NotificationListResponse | undefined) => {
      if (!old) return old;
      const nextItems = old.items.map(item => (item.id === id ? { ...item, isRead: true } : item));
      const nextUnreadCount = nextItems.filter(item => !item.isRead).length;
      return { ...old, items: nextItems, unreadCount: nextUnreadCount };
    });
  };
  const handleNotificationClick = (id: string, href: string, isRead: boolean) => {
    if (isLoggedIn && !isRead) {
      markReadMutation.mutate(id, { onSuccess: () => updateNotificationRead(id) });
    }
    setIsNotificationOpen(false);
    setTimeout(() => setIsNotificationVisible(false), 160);
    router.push(href);
  };
  const handleMarkAllRead = () => {
    if (!isLoggedIn) return;
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(notificationsKeys.list(), (old: NotificationListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            unreadCount: 0,
            items: old.items.map(item => ({ ...item, isRead: true })),
          };
        });
      },
    });
  };
  const openNotificationMenu = () => {
    setIsNotificationVisible(true);
    setIsNotificationOpen(true);
  };
  const closeNotificationMenu = () => {
    setIsNotificationOpen(false);
    setTimeout(() => setIsNotificationVisible(false), 160);
  };
  const toggleNotifications = () => {
    closeProfileMenu();
    if (isNotificationOpen) {
      closeNotificationMenu();
      return;
    }
    openNotificationMenu();
  };
  const openProfileMenu = () => {
    setIsProfileVisible(true);
    setIsProfileOpen(true);
  };
  const closeProfileMenu = () => {
    setIsProfileOpen(false);
    setTimeout(() => setIsProfileVisible(false), 160);
  };
  const toggleProfileMenu = () => {
    closeNotificationMenu();
    if (isProfileOpen) {
      closeProfileMenu();
      return;
    }
    openProfileMenu();
  };

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current || notificationRef.current.contains(event.target as Node)) return;
      closeNotificationMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNotificationMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current || profileRef.current.contains(event.target as Node)) return;
      closeProfileMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProfileMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (isLoggedIn) return;
    setIsProfileOpen(false);
    setIsProfileVisible(false);
  }, [isLoggedIn]);

  // 특정 경로에서는 Header 숨김
  if (HeaderConfig.hidePaths.includes(pathname)) {
    return null;
  }

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
                          onClick={toggleProfileMenu}
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
                              <CiUser aria-hidden="true" />
                              마이페이지
                            </Link>
                            <Link
                              href={profileLink}
                              className={styles.profileItem}
                              role="menuitem"
                              onClick={closeProfileMenu}
                            >
                              <CiFileOn aria-hidden="true" />내 블로그
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
                        onClick={toggleNotifications}
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
