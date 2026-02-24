import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 관리자 신고 생성 DTO
 * @description 메인 화면 버그 제보 입력값을 검증
 */
export class CreateAdminReportDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content!: string;
}
