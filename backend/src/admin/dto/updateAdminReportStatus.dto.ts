import { IsIn } from 'class-validator';

import { AdminReportStatus } from '../entities/adminReport.entity';

/**
 * 관리자 신고 상태 변경 DTO
 * @description 변경 가능한 신고 상태 값을 검증
 */
export class UpdateAdminReportStatusDto {
  @IsIn(Object.values(AdminReportStatus))
  status!: AdminReportStatus;
}
