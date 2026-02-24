import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * 역할 메타데이터 데코레이터
 * @description 엔드포인트 접근 허용 역할을 선언
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
