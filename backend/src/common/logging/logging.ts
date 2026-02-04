import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, INestApplication } from '@nestjs/common';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * 요청/응답 로깅
   * @description 요청 정보와 처리 시간을 로그로 남김
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;

    // 요청 로깅
    this.logger.log(`Request ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const className = context.getClass().name;
        const statusCode = response?.statusCode ?? 'unknown';
        this.logger.log(`Response ${method} ${url} ${statusCode} ${className} ${duration}ms`);
      }),
    );
  }
}

/**
 * 인터셉터 등록
 * @description 전역 로깅 인터셉터를 설정
 */
export const setupInterceptors = (app: INestApplication) => {
  app.useGlobalInterceptors(new LoggingInterceptor());
};
