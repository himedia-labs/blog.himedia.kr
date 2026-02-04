import { Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';

import { JwtGuard } from '@/auth/guards/jwt.guard';
import { NotificationsService } from '@/notifications/notifications.service';

import type { AuthRequest } from '@/notifications/notifications.types';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  /**
   * 알림 컨트롤러
   * @description 알림 관련 요청을 처리
   */
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 알림 목록
   * @description 알림 목록과 미확인 개수를 반환
   */
  @Get()
  getNotifications(@Request() req: AuthRequest, @Query('limit') limit?: string) {
    // 입력/정규화
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = Number.isFinite(parsed) ? Number(parsed) : undefined;

    return this.notificationsService.getNotifications(req.user.sub, safeLimit);
  }

  /**
   * 알림 전체 읽음
   * @description 모든 알림을 읽음 처리
   */
  @Patch('read-all')
  markAllRead(@Request() req: AuthRequest) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  /**
   * 알림 단건 읽음
   * @description 특정 알림을 읽음 처리
   */
  @Patch(':notificationId/read')
  markRead(@Param('notificationId') notificationId: string, @Request() req: AuthRequest) {
    return this.notificationsService.markRead(req.user.sub, notificationId);
  }
}
