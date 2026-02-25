import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, In, Not, Repository } from 'typeorm';

import { SnowflakeService } from '../common/services/snowflake.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { ERROR_CODES } from '../constants/error/error-codes';
import { ADMIN_ERROR_MESSAGES } from '../constants/message/admin.messages';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { AdminAuditLog } from './entities/adminAuditLog.entity';
import { AdminReport, AdminReportStatus } from './entities/adminReport.entity';

/**
 * 관리자 서비스
 * @description 관리자 전용 기능을 제공
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  /**
   * 관리자 서비스
   * @description 관리자 기능 처리에 필요한 의존성을 주입
   */
  constructor(
    @InjectRepository(AdminReport)
    private readonly adminReportsRepository: Repository<AdminReport>,
    @InjectRepository(AdminAuditLog)
    private readonly adminAuditLogsRepository: Repository<AdminAuditLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 관리자 상태 확인
   * @description 관리자 API 동작 여부를 반환
   */
  getHealth() {
    return { ok: true };
  }

  /**
   * 신고 목록 조회
   * @description 상태/제한 조건에 따라 신고 목록을 반환
   */
  async getReports(status?: AdminReportStatus, limit?: number) {
    // 값/보정
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30;

    // 조건/구성
    const where = status ? { status } : undefined;
    const reports = await this.adminReportsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    // 신고자/조회
    const reporterUserIds = Array.from(
      new Set(
        reports
          .map(report => report.reporterUserId)
          .filter((reporterUserId): reporterUserId is string => Boolean(reporterUserId)),
      ),
    );
    const reporters = reporterUserIds.length
      ? await this.usersRepository.find({
          where: { id: In(reporterUserIds) },
          select: ['id', 'name', 'email'],
        })
      : [];
    const reporterMap = new Map(reporters.map(reporter => [reporter.id, reporter]));

    return {
      items: reports.map(report => ({
        ...report,
        reporterName: report.reporterUserId ? (reporterMap.get(report.reporterUserId)?.name ?? null) : null,
        reporterEmail: report.reporterUserId ? (reporterMap.get(report.reporterUserId)?.email ?? null) : null,
      })),
    };
  }

  /**
   * 내 신고 목록 조회
   * @description 신고자가 본인인 신고 목록을 최신순으로 반환
   */
  async getMyReports(reporterUserId: string, limit?: number) {
    const normalizedReporterUserId = reporterUserId.trim();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30;

    const reports = await this.adminReportsRepository.find({
      where: { reporterUserId: normalizedReporterUserId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    return { items: reports };
  }

  /**
   * 감사로그 목록 조회
   * @description 최근 관리자 액션 이력을 반환
   */
  async getAuditLogs(limit?: number) {
    // 값/보정
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30;
    const logs = await this.adminAuditLogsRepository.find({
      where: { action: Not('ADMIN_PAGE_ACCESSED') },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });
    const userTargetIds = Array.from(new Set(logs.filter(log => log.targetType === 'user').map(log => log.targetId)));
    const userTargets = userTargetIds.length
      ? await this.usersRepository.find({
          where: { id: In(userTargetIds) },
          select: ['id', 'name', 'email'],
        })
      : [];
    const userTargetMap = new Map(userTargets.map(user => [user.id, user]));

    return {
      items: logs.map(log => ({
        ...log,
        targetName: log.targetType === 'user' ? (userTargetMap.get(log.targetId)?.name ?? null) : null,
        targetEmail: log.targetType === 'user' ? (userTargetMap.get(log.targetId)?.email ?? null) : null,
      })),
    };
  }

  /**
   * 관리자 접속일지 조회
   * @description 관리자 페이지 접속 이력을 최신순으로 반환
   */
  async getAccessLogs(limit?: number, page?: number) {
    await this.cleanupOldAccessLogs();

    // 값/보정
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30;
    const safePage = Number.isFinite(page) ? Math.max(Number(page), 1) : 1;
    const skipCount = (safePage - 1) * safeLimit;
    const logs = await this.adminAuditLogsRepository.find({
      where: { action: 'ADMIN_PAGE_ACCESSED' },
      order: { createdAt: 'DESC' },
      skip: skipCount,
      take: safeLimit + 1,
    });
    const hasMore = logs.length > safeLimit;
    const slicedLogs = hasMore ? logs.slice(0, safeLimit) : logs;
    const adminUserIds = Array.from(new Set(slicedLogs.map(log => log.adminUserId)));
    const admins = adminUserIds.length
      ? await this.usersRepository.find({
          where: { id: In(adminUserIds) },
          select: ['id', 'name', 'email'],
        })
      : [];
    const adminMap = new Map(admins.map(admin => [admin.id, admin]));

    return {
      items: slicedLogs.map(log => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        adminUserId: log.adminUserId,
        adminName: adminMap.get(log.adminUserId)?.name ?? '-',
        adminEmail: adminMap.get(log.adminUserId)?.email ?? '-',
        loginAt: this.readPayloadString(log.payload, 'loginAt') ?? log.createdAt.toISOString(),
        logoutAt: this.readPayloadString(log.payload, 'logoutAt'),
        ipAddress: this.readPayloadString(log.payload, 'ipAddress') ?? 'N/A',
        userAgent: this.readPayloadString(log.payload, 'userAgent') ?? 'N/A',
        sessionDurationSec: this.readPayloadNumber(log.payload, 'sessionDurationSec'),
        status: this.readPayloadString(log.payload, 'status') ?? '접속중',
        createdAt: log.createdAt,
      })),
      hasMore,
      page: safePage,
    };
  }

  /**
   * 승인 대기 회원 목록
   * @description 미승인 사용자 목록을 반환
   */
  async getPendingUsers(limit?: number) {
    // 값/보정
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30;
    const users = await this.usersRepository.find({
      where: { approved: false, withdrawn: false, role: Not(UserRole.ADMIN) },
      order: { createdAt: 'ASC' },
      take: safeLimit,
      select: ['id', 'name', 'email', 'phone', 'birthDate', 'requestedRole', 'role', 'course', 'approved', 'createdAt'],
    });

    return { items: users };
  }

  /**
   * 전체 회원 목록
   * @description 관리자 계정을 제외한 전체 회원 목록을 반환
   */
  async getUsers(limit?: number) {
    // 값/보정
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 300) : 100;
    const users = await this.usersRepository.find({
      where: { approved: true, withdrawn: false, role: Not(UserRole.ADMIN) },
      order: { createdAt: 'ASC' },
      take: safeLimit,
      select: [
        'id',
        'name',
        'email',
        'phone',
        'birthDate',
        'requestedRole',
        'role',
        'course',
        'approved',
        'withdrawn',
        'createdAt',
      ],
    });

    return { items: users };
  }

  /**
   * 회원 승인 처리
   * @description 승인 대기 회원을 승인 상태로 변경
   */
  async approveUser(userId: string, adminUserId: string) {
    const normalizedUserId = userId.trim();
    const normalizedAdminUserId = adminUserId.trim();

    // 대상/조회
    const targetUser = await this.usersRepository.findOne({ where: { id: normalizedUserId } });
    if (!targetUser) {
      await this.createAuditLog({
        adminUserId: normalizedAdminUserId,
        action: 'USER_APPROVED',
        targetType: 'user',
        targetId: normalizedUserId,
        payload: {
          result: 'FAILURE',
          reasonCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
          before: null,
          after: null,
        },
      });

      throw new NotFoundException({
        message: ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    // 상태/변경
    const beforeApproved = targetUser.approved;
    targetUser.approved = true;
    await this.usersRepository.save(targetUser);
    await this.createAuditLog({
      adminUserId: normalizedAdminUserId,
      action: 'USER_APPROVED',
      targetType: 'user',
      targetId: targetUser.id,
      payload: {
        result: 'SUCCESS',
        reasonCode: null,
        before: { approved: beforeApproved },
        after: { approved: targetUser.approved },
      },
    });

    return { id: targetUser.id, approved: targetUser.approved };
  }

  /**
   * 회원 역할 변경
   * @description 전체 회원의 역할을 지정한 값으로 수정
   */
  async updateUserRole(userId: string, role: UserRole, adminUserId: string) {
    const normalizedUserId = userId.trim();
    const normalizedAdminUserId = adminUserId.trim();

    // 대상/조회
    const targetUser = await this.usersRepository.findOne({ where: { id: normalizedUserId } });
    if (!targetUser) {
      await this.createAuditLog({
        adminUserId: normalizedAdminUserId,
        action: 'USER_ROLE_UPDATED',
        targetType: 'user',
        targetId: normalizedUserId,
        payload: {
          result: 'FAILURE',
          reasonCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
          before: null,
          after: null,
        },
      });

      throw new NotFoundException({
        message: ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    // 상태/변경
    const beforeRole = targetUser.role;
    targetUser.role = role;
    targetUser.requestedRole = role === UserRole.ADMIN ? targetUser.requestedRole : role;
    await this.usersRepository.save(targetUser);
    await this.createAuditLog({
      adminUserId: normalizedAdminUserId,
      action: 'USER_ROLE_UPDATED',
      targetType: 'user',
      targetId: targetUser.id,
      payload: {
        result: 'SUCCESS',
        reasonCode: null,
        before: { role: beforeRole },
        after: { role: targetUser.role },
      },
    });

    return { id: targetUser.id, role: targetUser.role };
  }

  /**
   * 관리자 접속 기록
   * @description 관리자 페이지 접근 이벤트를 감사로그에 저장
   */
  async trackAccess(adminUserId: string, ipAddress: string | null, userAgent: string | null) {
    await this.cleanupOldAccessLogs();

    // 상태/준비
    const now = new Date();
    const normalizedAdminUserId = adminUserId.trim();
    const normalizedIpAddress = ipAddress?.trim() || 'N/A';
    const normalizedUserAgent = userAgent?.trim() || 'N/A';
    const latestAccessLog = await this.adminAuditLogsRepository.findOne({
      where: { action: 'ADMIN_PAGE_ACCESSED', adminUserId: normalizedAdminUserId },
      order: { createdAt: 'DESC' },
    });

    // 중복/방지
    if (latestAccessLog) {
      const latestPayload = latestAccessLog.payload ?? null;
      const latestStatus = this.readPayloadString(latestPayload, 'status');
      const latestIpAddress = this.readPayloadString(latestPayload, 'ipAddress') ?? 'N/A';
      const latestUserAgent = this.readPayloadString(latestPayload, 'userAgent') ?? 'N/A';
      const diffMs = now.getTime() - latestAccessLog.createdAt.getTime();
      const isSameClient = latestIpAddress === normalizedIpAddress && latestUserAgent === normalizedUserAgent;
      if (latestStatus === '접속중' && isSameClient && diffMs < 2000) {
        return { ok: true, deduped: true };
      }

      // 이전/종료
      if (latestStatus === '접속중') {
        const loginAtValue = this.readPayloadString(latestPayload, 'loginAt');
        const loginAt = loginAtValue ? new Date(loginAtValue) : latestAccessLog.createdAt;
        const safeDuration = Math.max(0, Math.floor((now.getTime() - loginAt.getTime()) / 1000));
        latestAccessLog.payload = {
          ...(latestPayload ?? {}),
          ipAddress: latestIpAddress,
          userAgent: latestUserAgent,
          status: '종료',
          loginAt: loginAt.toISOString(),
          logoutAt: now.toISOString(),
          sessionDurationSec: safeDuration,
        };
        await this.adminAuditLogsRepository.save(latestAccessLog);
      }
    }

    await this.createAuditLog({
      adminUserId: normalizedAdminUserId,
      action: 'ADMIN_PAGE_ACCESSED',
      targetType: 'admin_page',
      targetId: 'admin',
      payload: {
        ipAddress: normalizedIpAddress,
        userAgent: normalizedUserAgent,
        status: '접속중',
        loginAt: now.toISOString(),
        logoutAt: null,
        sessionDurationSec: null,
      },
    });

    return { ok: true };
  }

  /**
   * 신고 상태 변경
   * @description 신고 상태를 변경하고 처리 정보를 기록
   */
  async updateReportStatus(reportId: string, status: AdminReportStatus, adminUserId: string) {
    const normalizedReportId = reportId.trim();
    const normalizedAdminUserId = adminUserId.trim();

    // 대상/조회
    const report = await this.adminReportsRepository.findOne({ where: { id: normalizedReportId } });
    if (!report) {
      await this.createAuditLog({
        adminUserId: normalizedAdminUserId,
        action: 'REPORT_STATUS_UPDATED',
        targetType: 'admin_report',
        targetId: normalizedReportId,
        payload: {
          result: 'FAILURE',
          reasonCode: ERROR_CODES.ADMIN_REPORT_NOT_FOUND,
          before: null,
          after: null,
        },
      });

      throw new NotFoundException({
        message: ADMIN_ERROR_MESSAGES.REPORT_NOT_FOUND,
        code: ERROR_CODES.ADMIN_REPORT_NOT_FOUND,
      });
    }

    // 상태/갱신
    const beforeStatus = report.status;
    report.status = status;
    report.handlerAdminId = normalizedAdminUserId;
    report.handledAt = new Date();
    await this.adminReportsRepository.save(report);
    await this.createAuditLog({
      adminUserId: normalizedAdminUserId,
      action: 'REPORT_STATUS_UPDATED',
      targetType: 'admin_report',
      targetId: report.id,
      payload: {
        result: 'SUCCESS',
        reasonCode: null,
        before: { status: beforeStatus, handledAt: null },
        after: { status: report.status, handledAt: report.handledAt.toISOString() },
      },
    });

    // 알림/생성
    const reportNotificationType = this.resolveReportStatusNotificationType(status);
    const normalizedReporterUserId = report.reporterUserId?.trim() ?? null;
    if (reportNotificationType && normalizedReporterUserId) {
      try {
        await this.notificationsService.createNotification({
          actorUserId: normalizedAdminUserId,
          targetUserId: normalizedReporterUserId,
          type: reportNotificationType,
        });
      } catch {
        this.logger.warn(
          `신고 상태 변경 알림 생성 실패 (reportId=${report.id}, reporterUserId=${normalizedReporterUserId}, status=${status})`,
        );
      }
    }

    return { id: report.id, status: report.status, handledAt: report.handledAt };
  }

  /**
   * 신고 생성
   * @description 운영 확인용 신고 데이터를 생성
   */
  async createReport(title: string, content: string, reporterUserId: string | null) {
    // 엔티티/생성
    const report = this.adminReportsRepository.create({
      id: this.snowflakeService.generate(),
      title: title.trim(),
      content: content.trim(),
      status: AdminReportStatus.OPEN,
      reporterUserId: reporterUserId?.trim() ?? null,
      handlerAdminId: null,
      handledAt: null,
    });

    // 저장/반환
    await this.adminReportsRepository.save(report);

    // 알림/생성
    const normalizedReporterUserId = reporterUserId?.trim() ?? null;
    if (normalizedReporterUserId) {
      try {
        await this.notificationsService.createNotification({
          actorUserId: normalizedReporterUserId,
          targetUserId: normalizedReporterUserId,
          type: NotificationType.REPORT_RECEIVED,
        });
      } catch {
        this.logger.warn(
          `REPORT_RECEIVED 알림 생성 실패 (reportId=${report.id}, reporterUserId=${normalizedReporterUserId})`,
        );
      }
    }

    return report;
  }

  /**
   * 감사 로그 생성
   * @description 관리자 액션 이력을 저장
   */
  private async createAuditLog({
    adminUserId,
    action,
    targetType,
    targetId,
    payload,
  }: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId: string;
    payload?: Record<string, unknown> | null;
  }) {
    // 엔티티/생성
    const auditLog = this.adminAuditLogsRepository.create({
      id: this.snowflakeService.generate(),
      action,
      targetType,
      targetId,
      adminUserId,
      payload: payload ?? null,
    });

    // 저장/처리
    await this.adminAuditLogsRepository.save(auditLog);
  }

  /**
   * payload 문자열 읽기
   * @description 감사로그 payload에서 문자열 값을 안전하게 추출
   */
  private readPayloadString(payload: Record<string, unknown> | null, key: string) {
    if (!payload) return null;
    const value = payload[key];
    return typeof value === 'string' && value.trim().length ? value : null;
  }

  /**
   * payload 숫자 읽기
   * @description 감사로그 payload에서 숫자 값을 안전하게 추출
   */
  private readPayloadNumber(payload: Record<string, unknown> | null, key: string) {
    if (!payload) return null;
    const value = payload[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  /**
   * 신고 상태 알림 타입
   * @description 신고 상태값을 사용자 알림 타입으로 변환
   */
  private resolveReportStatusNotificationType(status: AdminReportStatus) {
    if (status === AdminReportStatus.RESOLVED) return NotificationType.REPORT_RESOLVED;
    if (status === AdminReportStatus.REJECTED) return NotificationType.REPORT_REJECTED;
    return null;
  }

  /**
   * 접속일지 정리
   * @description 30일 지난 관리자 접속일지 로그를 자동 삭제
   */
  private async cleanupOldAccessLogs() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.adminAuditLogsRepository.delete({
      action: 'ADMIN_PAGE_ACCESSED',
      createdAt: LessThan(cutoff),
    });
  }
}
