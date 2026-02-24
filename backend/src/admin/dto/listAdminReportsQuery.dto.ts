import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

import { AdminReportStatus } from '../entities/adminReport.entity';

/**
 * 관리자 신고 목록 쿼리
 * @description 신고 목록 조회 조건을 검증
 */
export class ListAdminReportsQueryDto {
  @IsOptional()
  @IsIn(Object.values(AdminReportStatus))
  status?: AdminReportStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
