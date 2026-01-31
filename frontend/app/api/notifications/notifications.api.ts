import { axiosInstance } from '@/app/shared/network/axios.instance';

import type {
  MarkNotificationReadResponse,
  MarkNotificationsReadAllResponse,
  NotificationListResponse,
} from '@/app/shared/types/notification';

// 알림 목록 조회
const getNotifications = async (limit = 50): Promise<NotificationListResponse> => {
  const res = await axiosInstance.get<NotificationListResponse>('/notifications', {
    params: { limit },
  });
  return res.data;
};

// 알림 읽음 처리
const markNotificationRead = async (notificationId: string): Promise<MarkNotificationReadResponse> => {
  const res = await axiosInstance.patch<MarkNotificationReadResponse>(`/notifications/${notificationId}/read`);
  return res.data;
};

// 알림 전체 읽음 처리
const markNotificationsReadAll = async (): Promise<MarkNotificationsReadAllResponse> => {
  const res = await axiosInstance.patch<MarkNotificationsReadAllResponse>('/notifications/read-all');
  return res.data;
};

export const notificationsApi = {
  getNotifications,
  markNotificationRead,
  markNotificationsReadAll,
};
