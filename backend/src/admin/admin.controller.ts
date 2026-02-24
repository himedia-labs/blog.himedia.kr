import { Body, Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AdminService } from './admin.service';
import { ListAdminReportsQueryDto } from './dto/listAdminReportsQuery.dto';
import { UpdateAdminReportStatusDto } from './dto/updateAdminReportStatus.dto';

import type { AdminAuthRequest } from './admin.types';

/**
 * 관리자 컨트롤러
 * @description 관리자 전용 API를 처리
 */
@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  /**
   * 관리자 컨트롤러
   * @description 관리자 관련 요청 처리기를 생성
   */
  constructor(private readonly adminService: AdminService) {}

  /**
   * 관리자 상태
   * @description 관리자 API 접근 가능 여부를 반환
   */
  @Get('health')
  getHealth(@Request() req: AdminAuthRequest) {
    // 응답/구성
    const result = this.adminService.getHealth();

    return { ...result, adminId: req.user.sub };
  }

  /**
   * 신고 목록 조회
   * @description 운영자가 신고 목록을 조회
   */
  @Get('reports')
  getReports(@Query() query: ListAdminReportsQueryDto) {
    return this.adminService.getReports(query.status, query.limit);
  }

  /**
   * 감사로그 목록 조회
   * @description 운영자가 관리자 액션 로그를 조회
   */
  @Get('audit-logs')
  getAuditLogs(@Query('limit') limit?: string) {
    // 입력/정규화
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = Number.isFinite(parsed) ? Number(parsed) : undefined;

    return this.adminService.getAuditLogs(safeLimit);
  }

  /**
   * 승인 대기 회원 목록
   * @description 운영자가 승인 대기 회원을 조회
   */
  @Get('users/pending')
  getPendingUsers(@Query('limit') limit?: string) {
    // 입력/정규화
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = Number.isFinite(parsed) ? Number(parsed) : undefined;

    return this.adminService.getPendingUsers(safeLimit);
  }

  /**
   * 신고 상태 변경
   * @description 운영자가 신고 상태를 갱신
   */
  @Patch('reports/:reportId/status')
  updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() body: UpdateAdminReportStatusDto,
    @Request() req: AdminAuthRequest,
  ) {
    return this.adminService.updateReportStatus(reportId, body.status, req.user.sub);
  }

  /**
   * 회원 승인 처리
   * @description 운영자가 대기 회원을 승인
   */
  @Patch('users/:userId/approve')
  approveUser(@Param('userId') userId: string, @Request() req: AdminAuthRequest) {
    return this.adminService.approveUser(userId, req.user.sub);
  }
}
