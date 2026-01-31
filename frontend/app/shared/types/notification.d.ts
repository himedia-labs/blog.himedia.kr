export type NotificationType = 'POST_LIKE' | 'POST_COMMENT' | 'COMMENT_LIKE' | 'COMMENT_REPLY';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  createdAtMs: number;
  isRead: boolean;
}

export interface NotificationListResponse {
  unreadCount: number;
  items: NotificationItem[];
}

export interface MarkNotificationReadResponse {
  id: string;
}

export interface MarkNotificationsReadAllResponse {
  updated: number;
}

// 알림 쿼리 옵션
export type NotificationsQueryOptions = {
  enabled?: boolean;
  limit?: number;
};
