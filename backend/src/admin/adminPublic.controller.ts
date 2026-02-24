import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

import { AdminService } from './admin.service';
import { CreateAdminReportDto } from './dto/createAdminReport.dto';

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
