import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
  Logger,
  INestApplication,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  ExceptionMessage,
  StandardErrorResponse,
} from './httpException.types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // HTTP 예외를 잡아 응답 포맷을 통일
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 요청의 body/params/query 추출
    const body = request.body as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;
    const query = request.query as Record<string, unknown>;

    const paramMessage = formatSection('params', params);
    const queryMessage = formatSection('query', query);
    const bodyMessage = formatSection('body', body);
    const errorMessage = extractErrorMessage(exception);

    this.logger.error(
      `Error to ${request.method} ${request.url} ${paramMessage} ${queryMessage} ${bodyMessage}\n` +
        `statusCode : ${status}\n` +
        `message : ${JSON.stringify(errorMessage, null, 2)}`,
    );

    // 표준 에러 응답 페이로드 구성
    const payload: StandardErrorResponse = {
      statusCode: status,
      message: errorMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}

// 요청 본문/파라미터/쿼리 파트를 문자열로 포맷
const formatSection = (label: string, data: Record<string, unknown>) =>
  Object.keys(data).length
    ? ` \n ${label}: ${JSON.stringify(data, null, 2)}`
    : '';

// HttpException으로부터 에러 메시지를 추출
const extractErrorMessage = (exception: HttpException): ExceptionMessage => {
  const exceptionResponse = exception.getResponse();

  if (typeof exceptionResponse === 'string') {
    return exceptionResponse;
  }

  if (
    typeof exceptionResponse === 'object' &&
    exceptionResponse !== null &&
    'message' in exceptionResponse
  ) {
    const messageValue = (exceptionResponse as { message?: unknown }).message;
    if (typeof messageValue === 'string' || Array.isArray(messageValue)) {
      return messageValue;
    }
  }

  return exception.message;
};

export const setupFilters = (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
};
