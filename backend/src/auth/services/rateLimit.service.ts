import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ERROR_CODES } from '../../constants/error/error-codes';
import { PASSWORD_ERROR_MESSAGES } from '../../constants/message/password.messages';

import type { ErrorCode } from '../../constants/error/error-codes';
import type { RateLimitEntry, RateLimitKey, RateLimitRule } from '../interfaces/rateLimit.interface';

/**
 * 레이트리밋 서비스
 * @description 키별 카운트를 인메모리로 관리하며 제한 초과 시 429 발생
 */

@Injectable()
export class RateLimitService {
  // 인메모리 레이트 리밋 카운터 (키별 카운트/만료시각 관리)
  private readonly store = new Map<RateLimitKey, RateLimitEntry>();

  /**
   * 레이트 리밋 규칙 소진
   * @description 각 규칙마다 카운트를 증가시키고 초과 시 429 예외 발생
   */
  consume(rules: RateLimitRule[], error?: { message?: string; code?: ErrorCode }) {
    const now = Date.now();
    const message = error?.message ?? PASSWORD_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    const defaultCode: ErrorCode = ERROR_CODES.PASSWORD_TOO_MANY_REQUESTS;
    const code: ErrorCode = error?.code ?? defaultCode;

    for (const rule of rules) {
      // 기존 엔트리 조회
      const entry = this.store.get(rule.key);

      // 만료됐거나 없으면 초기화
      if (!entry || entry.resetAt <= now) {
        this.store.set(rule.key, { count: 1, resetAt: now + rule.windowMs });
        continue;
      }

      // 한도 초과 시 429
      if (entry.count >= rule.limit) {
        throw new HttpException({ message, code }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // 카운트 증가 후 저장
      entry.count += 1;
      this.store.set(rule.key, entry);
    }
  }
}
