import { IsIn } from 'class-validator';

import { UserRole } from '../../auth/entities/user.entity';

/**
 * 관리자 회원 역할 변경 DTO
 * @description 변경 가능한 회원 역할 값을 검증
 */
export class UpdateAdminUserRoleDto {
  @IsIn([UserRole.TRAINEE, UserRole.GRADUATE, UserRole.MENTOR, UserRole.INSTRUCTOR])
  role!: UserRole;
}
