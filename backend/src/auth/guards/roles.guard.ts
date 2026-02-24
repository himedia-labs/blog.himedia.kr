import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { ERROR_CODES } from '../../constants/error/error-codes';
import { AUTH_ERROR_MESSAGES } from '../../constants/message/auth.messages';

import { ROLES_KEY } from '../decorators/roles.decorator';

import type { UserRole } from '../entities/user.entity';

/**
 * 역할 기반 인가 가드
 * @description 지정된 역할과 사용자 역할을 비교하여 접근을 허용
 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // 권한/메타
    const handler = context.getHandler();
    const classRef = context.getClass();
    const handlerRoles = Reflect.getMetadata(ROLES_KEY, handler) as UserRole[] | undefined;
    const classRoles = Reflect.getMetadata(ROLES_KEY, classRef) as UserRole[] | undefined;

    // 권한/대상
    const requiredRoles = handlerRoles ?? classRoles;
    if (!requiredRoles?.length) return true;

    // 요청/사용자
    const request = context.switchToHttp().getRequest<{ user?: { role?: UserRole } }>();
    const currentRole = request.user?.role;

    // 상태/검증
    if (currentRole && requiredRoles.includes(currentRole)) return true;

    throw new ForbiddenException({
      message: AUTH_ERROR_MESSAGES.FORBIDDEN_ROLE,
      code: ERROR_CODES.AUTH_FORBIDDEN_ROLE,
    });
  }
}
