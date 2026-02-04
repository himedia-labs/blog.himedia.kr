import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { SnowflakeService } from '@/common/services/snowflake.service';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { NOTIFICATION_ERROR_MESSAGES } from '@/constants/message/notification.messages';

import { Notification, NotificationType } from '@/notifications/entities/notification.entity';

import type { ErrorCode } from '@/constants/error/error-codes';
import type { CreateNotificationInput } from '@/notifications/notifications.types';

/**
 * 알림 요약 생성
 * @description 본문 일부를 maxLength 기준으로 잘라냄
 */
const buildExcerpt = (value: string | null | undefined, maxLength = 60) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
};

@Injectable()
export class NotificationsService {
  /**
   * 알림 서비스
   * @description 알림 생성/조회/읽음 처리를 담당
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 알림 생성
   * @description 알림 엔티티를 생성하고 저장
   */
  async createNotification({
    actorUserId,
    targetUserId,
    type,
    postId = null,
    commentId = null,
  }: CreateNotificationInput) {
    // 입력/정규화
    const safeActorId = this.normalizeUserId(actorUserId);
    const safeTargetId = this.normalizeUserId(targetUserId);

    if (safeActorId === safeTargetId) return;

    // 엔티티/생성
    const notification = this.notificationsRepository.create({
      id: this.snowflakeService.generate(),
      actorUserId: safeActorId,
      targetUserId: safeTargetId,
      postId,
      commentId,
      type,
      readAt: null,
    });

    // 저장/처리
    await this.notificationsRepository.save(notification);
  }

  /**
   * 알림 목록
   * @description 알림 목록과 읽지 않은 개수를 반환
   */
  async getNotifications(userId: string, limit?: number) {
    // 입력/정규화
    const safeLimit = this.normalizeLimit(limit);
    const safeUserId = this.normalizeUserId(userId);

    // 목록/조회
    const notifications = await this.notificationsRepository.find({
      where: { targetUserId: safeUserId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      relations: { actorUser: true, post: true, comment: true },
    });

    // 미확인/조회
    const unreadCount = await this.notificationsRepository.count({
      where: { targetUserId: safeUserId, readAt: IsNull() },
    });

    // 응답/매핑
    return {
      unreadCount,
      items: notifications.map(notification => this.buildNotificationView(notification)),
    };
  }

  /**
   * 알림 전체 읽음
   * @description 읽지 않은 알림을 모두 읽음 처리
   */
  async markAllRead(userId: string) {
    // 입력/정규화
    const safeUserId = this.normalizeUserId(userId);

    // 읽음/처리
    const result = await this.notificationsRepository.update(
      { targetUserId: safeUserId, readAt: IsNull() },
      { readAt: new Date() },
    );

    return { updated: result.affected ?? 0 };
  }

  /**
   * 알림 단건 읽음
   * @description 특정 알림을 읽음 처리
   */
  async markRead(userId: string, notificationId: string) {
    // 입력/정규화
    const safeUserId = this.normalizeUserId(userId);
    const safeNotificationId = notificationId.trim();

    // 대상/조회
    const notification = await this.notificationsRepository.findOne({
      where: { id: safeNotificationId, targetUserId: safeUserId },
    });

    if (!notification) {
      const code = ERROR_CODES.NOTIFICATION_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: NOTIFICATION_ERROR_MESSAGES.NOTIFICATION_NOT_FOUND, code });
    }

    // 읽음/처리
    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return { id: notification.id };
  }

  /**
   * 사용자 ID 정규화
   * @description 사용자 ID를 트림하여 반환
   */
  private normalizeUserId(userId: string) {
    return userId.trim();
  }

  /**
   * 조회 제한 정규화
   * @description limit을 1~100 범위로 보정
   */
  private normalizeLimit(limit?: number) {
    const safeLimit = Number.isFinite(limit) ? Number(limit) : 50;

    return Math.min(Math.max(safeLimit, 1), 100);
  }

  /**
   * 알림 뷰 생성
   * @description 알림 데이터를 응답 포맷으로 변환
   */
  private buildNotificationView(notification: Notification) {
    // 메타/정의
    const postTitle = notification.post?.title ?? '게시글';
    const actorName = notification.actorUser?.name ?? '누군가';

    // 댓글/요약
    const commentContent = notification.comment?.content ?? '';
    const commentExcerpt = buildExcerpt(commentContent);

    // 기본/초기값
    let title = '';
    let description = '';
    let href = notification.postId ? `/posts/${notification.postId}` : '/';

    switch (notification.type) {
      case NotificationType.POST_LIKE:
        title = `${actorName}님이 내 게시글을 좋아합니다`;
        description = `“${postTitle}”`;
        break;
      case NotificationType.POST_COMMENT:
        title = `${actorName}님이 내 게시글에 댓글을 남겼어요`;
        description = commentExcerpt ? `“${commentExcerpt}”` : '“댓글이 도착했어요.”';
        if (notification.commentId) {
          href = `/posts/${notification.postId}#comment-${notification.commentId}`;
        }
        break;
      case NotificationType.COMMENT_LIKE:
        title = `${actorName}님이 내 댓글을 좋아합니다`;
        description = commentExcerpt ? `“${commentExcerpt}”` : '“댓글에 좋아요가 달렸어요.”';
        if (notification.commentId) {
          href = `/posts/${notification.postId}#comment-${notification.commentId}`;
        }
        break;
      case NotificationType.COMMENT_REPLY:
        title = `${actorName}님이 내 댓글에 답글을 남겼어요`;
        description = commentExcerpt ? `“${commentExcerpt}”` : '“답글이 도착했어요.”';
        if (notification.commentId) {
          href = `/posts/${notification.postId}#comment-${notification.commentId}`;
        }
        break;
      default:
        break;
    }

    // 시간/상태
    const isRead = Boolean(notification.readAt);
    const createdAtMs = notification.createdAt.getTime();
    const createdAt = notification.createdAt.toISOString();

    return {
      id: notification.id,
      type: notification.type,
      title,
      description,
      href,
      createdAt,
      createdAtMs,
      isRead,
    };
  }
}
