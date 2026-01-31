import { useMutation } from '@tanstack/react-query';

import { notificationsApi } from '@/app/api/notifications/notifications.api';

import type { MarkNotificationReadResponse, MarkNotificationsReadAllResponse } from '@/app/shared/types/notification';

// 알림 읽음 처리
export const useMarkNotificationReadMutation = () => {
  return useMutation<MarkNotificationReadResponse, Error, string>({
    mutationFn: notificationId => notificationsApi.markNotificationRead(notificationId),
  });
};

// 알림 전체 읽음 처리
export const useMarkNotificationsReadAllMutation = () => {
  return useMutation<MarkNotificationsReadAllResponse, Error, void>({
    mutationFn: () => notificationsApi.markNotificationsReadAll(),
  });
};
