import { Catch, ArgumentsHost, HttpException, ExceptionFilter, Logger, INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ExceptionMessage, StandardErrorResponse } from './httpException.types';

/**
 * 요청 데이터를 로그용 문자열로 변환
 */
const formatSection = (label: string, data: Record<string, unknown>) =>
  data && Object.keys(data).length ? ` \n ${label}: ${JSON.stringify(data, null, 2)}` : '';

/**
 * HttpException에서 에러 메시지 추출
 */
const extractErrorMessage = (exception: HttpException): ExceptionMessage => {
  const exceptionResponse = exception.getResponse();

  if (typeof exceptionResponse === 'string') {
    return exceptionResponse;
  }

  if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
    const messageValue = (exceptionResponse as { message?: unknown }).message;
    if (typeof messageValue === 'string' || Array.isArray(messageValue)) {
      return messageValue;
    }
  }

  return exception.message;
};

/**
 * HTTP 예외 필터
 * @description 모든 HttpException을 잡아 표준 형식으로 응답
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const body = request.body as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;
    const query = request.query as Record<string, unknown>;

    const paramMessage = formatSection('params', params);
    const queryMessage = formatSection('query', query);
    const bodyMessage = formatSection('body', body);
    const errorMessage = extractErrorMessage(exception);

    // 에러 로그 출력
    this.logger.error(
      `Error to ${request.method} ${request.url} ${paramMessage} ${queryMessage} ${bodyMessage}\n` +
        `statusCode : ${status}\n` +
        `message : ${JSON.stringify(errorMessage, null, 2)}`,
    );

    // 표준 에러 응답
    const payload: StandardErrorResponse = {
      statusCode: status,
      message: errorMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}

/**
 * 전역 예외 필터 설정
 */
export const setupFilters = (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
};
