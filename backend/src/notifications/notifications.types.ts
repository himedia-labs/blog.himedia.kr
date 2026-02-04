import { NotificationType } from '@/notifications/entities/notification.entity';

import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '@/auth/interfaces/jwt.interface';

export type AuthRequest = ExpressRequest & { user: JwtPayload };

export type CreateNotificationInput = {
  actorUserId: string;
  targetUserId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
};
