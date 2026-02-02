import { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import {
  useMarkNotificationReadMutation,
  useMarkNotificationsReadAllMutation,
} from '@/app/api/notifications/notifications.mutations';
import { notificationsKeys } from '@/app/api/notifications/notifications.keys';
import { useNotificationsQuery } from '@/app/api/notifications/notifications.queries';

import { getNotificationSection } from '@/app/shared/utils/notification.utils';

import type { NotificationListResponse } from '@/app/shared/types/notification';

/**
 * 알림 메뉴 훅
 * @description 알림 드롭다운 메뉴 상태와 핸들러를 관리
 */
export const useNotificationMenu = (params: { isLoggedIn: boolean; router: AppRouterInstance }) => {
  const { isLoggedIn, router } = params;

  // UI 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'today' | 'week' | 'earlier'>('today');
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // UI 참조
  const notificationRef = useRef<HTMLDivElement | null>(null);

  // 요청 훅
  const queryClient = useQueryClient();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkNotificationsReadAllMutation();

  const { data: notificationsData } = useNotificationsQuery({ enabled: isLoggedIn });

  // 알림 파생 상태
  const notifications = notificationsData?.items ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;
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

  const toggleNotifications = (closeOtherMenus: () => void) => {
    closeOtherMenus();
    if (isNotificationOpen) {
      closeNotificationMenu();
      return;
    }
    openNotificationMenu();
  };

  // 외부 클릭/ESC 키 처리
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

  return {
    notificationRef,
    isNotificationOpen,
    isNotificationVisible,
    notificationTab,
    setNotificationTab,
    notifications,
    unreadCount,
    hasUnread,
    filteredNotifications,
    visibleNotifications,
    hasNotifications,
    notificationTabIndex,
    handleNotificationClick,
    handleMarkAllRead,
    toggleNotifications,
  };
};
