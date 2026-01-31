import { useQuery } from '@tanstack/react-query';

import { notificationsApi } from '@/app/api/notifications/notifications.api';
import { notificationsKeys } from '@/app/api/notifications/notifications.keys';

import type { NotificationListResponse, NotificationsQueryOptions } from '@/app/shared/types/notification';

// 알림 목록 조회
export const useNotificationsQuery = ({ enabled = true, limit = 50 }: NotificationsQueryOptions = {}) => {
  return useQuery<NotificationListResponse>({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsApi.getNotifications(limit),
    enabled,
  });
};
