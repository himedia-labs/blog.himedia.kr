import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { RateLimitService } from '@/auth/services/rateLimit.service';

import { PASSWORD_RATE_LIMIT_CONFIG } from '@/constants/config/rate-limit.config';

import type { Request } from 'express';
import type { RateLimitRule } from '@/auth/interfaces/rateLimit.interface';

/**
 * 비밀번호 재설정 코드 요청 레이트 리밋 가드
 * @description 이메일/IP 기준 1분/1시간 요청 횟수를 제한하여 남용 방지
 *  - 이메일: 분당 3회, 시간당 6회
 *  - IP: 분당 10회, 시간당 30회
 */
@Injectable()
export class PasswordRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    // 요청에서 이메일/IP 추출 (없으면 undefined/unknown)
    const request = context.switchToHttp().getRequest<Request>();
    const body = (request.body ?? {}) as Partial<{ email?: string }>;
    const email = body.email?.toLowerCase()?.trim();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    const rules: RateLimitRule[] = [];

    // 이메일 기준 레이트 리밋 (가입 여부와 무관)
    if (email) {
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
    }

    // IP 기준 레이트 리밋 (가입 여부와 무관)
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
