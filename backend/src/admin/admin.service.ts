import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { SnowflakeService } from '../common/services/snowflake.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { ERROR_CODES } from '../constants/error/error-codes';
import { ADMIN_ERROR_MESSAGES } from '../constants/message/admin.messages';

import { AdminAuditLog } from './entities/adminAuditLog.entity';
import { AdminReport, AdminReportStatus } from './entities/adminReport.entity';

/**
 * 관리자 서비스
 * @description 관리자 전용 기능을 제공
 */
@Injectable()
export class AdminService {
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
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    return { items: logs };
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
   * 회원 승인 처리
   * @description 승인 대기 회원을 승인 상태로 변경
   */
  async approveUser(userId: string, adminUserId: string) {
    // 대상/조회
    const targetUser = await this.usersRepository.findOne({ where: { id: userId.trim() } });
    if (!targetUser) {
      throw new NotFoundException({
        message: ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    // 상태/변경
    targetUser.approved = true;
    await this.usersRepository.save(targetUser);
    await this.createAuditLog({
      adminUserId: adminUserId.trim(),
      action: 'USER_APPROVED',
      targetType: 'user',
      targetId: targetUser.id,
      payload: { approved: true },
    });

    return { id: targetUser.id, approved: targetUser.approved };
  }

  /**
   * 신고 상태 변경
   * @description 신고 상태를 변경하고 처리 정보를 기록
   */
  async updateReportStatus(reportId: string, status: AdminReportStatus, adminUserId: string) {
    // 대상/조회
    const report = await this.adminReportsRepository.findOne({ where: { id: reportId.trim() } });
    if (!report) {
      throw new NotFoundException({
        message: ADMIN_ERROR_MESSAGES.REPORT_NOT_FOUND,
        code: ERROR_CODES.ADMIN_REPORT_NOT_FOUND,
      });
    }

    // 상태/갱신
    report.status = status;
    report.handlerAdminId = adminUserId.trim();
    report.handledAt = new Date();
    await this.adminReportsRepository.save(report);
    await this.createAuditLog({
      adminUserId: adminUserId.trim(),
      action: 'REPORT_STATUS_UPDATED',
      targetType: 'admin_report',
      targetId: report.id,
      payload: { status: report.status, handledAt: report.handledAt.toISOString() },
    });

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
    payload?: Record<string, unknown>;
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
}
