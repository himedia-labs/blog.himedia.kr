import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

import { AdminService } from './admin.service';
import { CreateAdminReportDto } from './dto/createAdminReport.dto';
import type { AdminAuthRequest } from './admin.types';

type OptionalAuthRequest = ExpressRequest & {
  user?: {
    sub?: string;
  };
};

/**
 * 관리자 공개 컨트롤러
 * @description 운영 대상이 보는 신고 생성 API를 처리
 */
@Controller('reports')
export class AdminPublicController {
  /**
   * 관리자 공개 컨트롤러
   * @description 신고 생성 처리기를 초기화
   */
  constructor(private readonly adminService: AdminService) {}

  /**
   * 내 신고 목록 조회
   * @description 로그인 사용자의 신고 목록을 최신순으로 반환
   */
  @Get('me')
  @UseGuards(JwtGuard)
  getMyReports(@Request() req: AdminAuthRequest, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = Number.isFinite(parsed) ? Number(parsed) : undefined;

    return this.adminService.getMyReports(req.user.sub, safeLimit);
  }

  /**
   * 신고 생성
   * @description 메인 화면에서 입력한 신고를 저장
   */
  @Post()
  @UseGuards(OptionalJwtGuard)
  createReport(@Body() body: CreateAdminReportDto, @Request() req: OptionalAuthRequest) {
    const reporterUserId = req.user?.sub?.trim() ? req.user.sub : null;

    return this.adminService.createReport(body.title, body.content, reporterUserId);
  }
}
