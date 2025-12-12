import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { PASSWORD_RATE_LIMIT_CONFIG } from '../../constants/config/rate-limit.config';
import { RateLimitService } from '../services/rateLimit.service';
import { UserService } from '../services/user.service';

import type { Request } from 'express';
import type { RateLimitRule } from '../interfaces/rateLimit.interface';

/**
 * 비밀번호 재설정 코드 요청 레이트 리밋 가드
 * @description 이메일/IP 기준 1분/1시간 요청 횟수를 제한하여 남용 방지
 *  - 이메일: 분당 3회, 시간당 6회
 *  - IP: 분당 10회, 시간당 30회
 */
@Injectable()
export class PasswordRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 요청에서 이메일/IP 추출 (없으면 undefined/unknown)
    const request = context.switchToHttp().getRequest<Request>();
    const body = (request.body ?? {}) as Partial<{ email?: string }>;
    const email = body.email?.toLowerCase()?.trim();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    // 룰 정의
    const rules: RateLimitRule[] = [];

    // 가입된 이메일이 아닐 경우 레이트 리밋을 건너뛰고 바로 진행
    const existingUser = email ? await this.userService.findUserByEmail(email) : null;
    if (!existingUser) {
      return true;
    }

    // 이메일 기준 레이트 리밋
    rules.push(
      {
        key: `email:1m:${email}`,
        windowMs: PASSWORD_RATE_LIMIT_CONFIG.EMAIL.PER_MINUTE.WINDOW_MS,
        limit: PASSWORD_RATE_LIMIT_CONFIG.EMAIL.PER_MINUTE.LIMIT,
      },
      {
        key: `email:1h:${email}`,
        windowMs: PASSWORD_RATE_LIMIT_CONFIG.EMAIL.PER_HOUR.WINDOW_MS,
        limit: PASSWORD_RATE_LIMIT_CONFIG.EMAIL.PER_HOUR.LIMIT,
      },
    );

    // IP 기준 레이트 리밋 (가입된 이메일 요청에 한해 적용)
    if (ip) {
      rules.push(
        {
          key: `ip:1m:${ip}`,
          windowMs: PASSWORD_RATE_LIMIT_CONFIG.IP.PER_MINUTE.WINDOW_MS,
          limit: PASSWORD_RATE_LIMIT_CONFIG.IP.PER_MINUTE.LIMIT,
        },
        {
          key: `ip:1h:${ip}`,
          windowMs: PASSWORD_RATE_LIMIT_CONFIG.IP.PER_HOUR.WINDOW_MS,
          limit: PASSWORD_RATE_LIMIT_CONFIG.IP.PER_HOUR.LIMIT,
        },
      );
    }

    // 룰 적용 (초과 시 429 예외)
    if (rules.length) {
      this.rateLimitService.consume(rules);
    }

    return true;
  }
}
