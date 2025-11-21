import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  INestApplication,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const body = request.body as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;
    const query = request.query as Record<string, unknown>;

    const paramMessage = Object.keys(params).length
      ? ` \n params: ${JSON.stringify(params, null, 2)}`
      : '';
    const queryMessage = Object.keys(query).length
      ? ` \n query: ${JSON.stringify(query, null, 2)}`
      : '';
    const bodyMessage = Object.keys(body).length
      ? ` \n body: ${JSON.stringify(body, null, 2)}`
      : '';

    this.logger.log(
      `Request to ${method} ${url} ${paramMessage} ${queryMessage} ${bodyMessage}`,
    );

    return next
      .handle()
      .pipe(
        tap((data) =>
          this.logger.log(
            `Response from ${method} ${url} ${context.getClass().name} ${
              Date.now() - now
            }ms \n response: ${JSON.stringify(data, null, 2)}`,
          ),
        ),
      );
  }
}

export const setupInterceptors = (app: INestApplication) => {
  app.useGlobalInterceptors(new LoggingInterceptor());
};
