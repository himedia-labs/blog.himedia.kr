import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, INestApplication } from '@nestjs/common';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  // 보이면 안되는 친구들:)
  private readonly sensitiveKeys = new Set([
    'password',
    'currentPassword',
    'newPassword',
    'accessToken',
    'refreshToken',
    'token',
    'code',
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    // Request 로깅
    const requestInfo = this.formatRequestInfo(request);
    this.logger.log(`Request to ${method} ${url}${requestInfo}`);

    return next.handle().pipe(
      tap(data => {
        const duration = Date.now() - now;
        const className = context.getClass().name;

        // Response 로깅
        if (data !== undefined && data !== null) {
          try {
            const responseData = JSON.stringify(this.sanitizeData(data), null, 2);
            this.logger.log(`Response from ${method} ${url} ${className} ${duration}ms \n response: ${responseData}`);
          } catch {
            // circular structure 에러 처리
            this.logger.log(
              `Response from ${method} ${url} ${className} ${duration}ms (response contains circular structure)`,
            );
          }
        } else {
          this.logger.log(`Response from ${method} ${url} ${className} ${duration}ms (no response data)`);
        }
      }),
    );
  }

  /**
   * Request 정보 포맷팅
   */
  private formatRequestInfo(request: Request): string {
    const params = request.params as Record<string, unknown> | undefined;
    const query = request.query as Record<string, unknown> | undefined;
    const body = request.body as Record<string, unknown> | undefined;

    const parts: string[] = [];

    if (params && Object.keys(params).length > 0) {
      parts.push(`params: ${JSON.stringify(this.sanitizeData(params), null, 2)}`);
    }
    if (query && Object.keys(query).length > 0) {
      parts.push(`query: ${JSON.stringify(this.sanitizeData(query), null, 2)}`);
    }
    if (body && Object.keys(body).length > 0) {
      parts.push(`body: ${JSON.stringify(this.sanitizeData(body), null, 2)}`);
    }

    return parts.length > 0 ? ` \n ${parts.join(' \n ')}` : '';
  }

  /**
   * 민감정보 마스킹
   */
  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>).map(([key, value]) => {
        if (this.sensitiveKeys.has(key)) {
          return [key, '[REDACTED]'];
        }
        return [key, this.sanitizeData(value)];
      });
      return Object.fromEntries(entries);
    }
    return data;
  }
}

export const setupInterceptors = (app: INestApplication) => {
  app.useGlobalInterceptors(new LoggingInterceptor());
};
