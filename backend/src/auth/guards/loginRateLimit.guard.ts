import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { RateLimitService } from '@/auth/services/rateLimit.service';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { AUTH_ERROR_MESSAGES } from '@/constants/message/auth.messages';
import { LOGIN_RATE_LIMIT_CONFIG } from '@/constants/config/rate-limit.config';

import type { Request } from 'express';
import type { ErrorCode } from '@/constants/error/error-codes';
import type { RateLimitRule } from '@/auth/interfaces/rateLimit.interface';

/**
 * 로그인 레이트 리밋 가드
 * @description 이메일/IP 기준 요청 횟수를 제한하여 무차별 대입 방지
 *  - 이메일: 분당 5회, 시간당 20회
 *  - IP: 분당 20회, 시간당 100회
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    // 요청에서 이메일/IP 추출
    const request = context.switchToHttp().getRequest<Request<unknown, unknown, { email?: string }>>();
    const email = request.body?.email?.toLowerCase()?.trim();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    const rules: RateLimitRule[] = [];

    if (email) {
      rules.push(
        {
          key: `login:email:1m:${email}`,
          windowMs: LOGIN_RATE_LIMIT_CONFIG.EMAIL.PER_MINUTE.WINDOW_MS,
          limit: LOGIN_RATE_LIMIT_CONFIG.EMAIL.PER_MINUTE.LIMIT,
        },
        {
          key: `login:email:1h:${email}`,
          windowMs: LOGIN_RATE_LIMIT_CONFIG.EMAIL.PER_HOUR.WINDOW_MS,
          limit: LOGIN_RATE_LIMIT_CONFIG.EMAIL.PER_HOUR.LIMIT,
        },
      );
    }

    if (ip) {
      rules.push(
        {
          key: `login:ip:1m:${ip}`,
          windowMs: LOGIN_RATE_LIMIT_CONFIG.IP.PER_MINUTE.WINDOW_MS,
          limit: LOGIN_RATE_LIMIT_CONFIG.IP.PER_MINUTE.LIMIT,
        },
        {
          key: `login:ip:1h:${ip}`,
          windowMs: LOGIN_RATE_LIMIT_CONFIG.IP.PER_HOUR.WINDOW_MS,
          limit: LOGIN_RATE_LIMIT_CONFIG.IP.PER_HOUR.LIMIT,
        },
      );
    }

    if (rules.length) {
      const errorCode: ErrorCode = ERROR_CODES.AUTH_TOO_MANY_LOGIN_ATTEMPTS;
      this.rateLimitService.consume(rules, {
        message: AUTH_ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS,
        code: errorCode,
      });
    }

    return true;
  }
}
