import { Catch, ArgumentsHost, HttpException, ExceptionFilter, Logger, INestApplication } from '@nestjs/common';

import type { Request, Response } from 'express';
import type { FieldErrors, StandardErrorResponse } from '@/common/exception/httpException.types';

/**
 * 요청 데이터 변환
 * @description 로그용 문자열로 변환
 */
const formatSection = (label: string, data: Record<string, unknown>) =>
  data && Object.keys(data).length ? ` \n ${label}: ${JSON.stringify(data, null, 2)}` : '';

/**
 * 필드 에러 검사
 * @description 필드별 에러 객체 여부를 확인
 */
const isFieldErrors = (value: unknown): value is FieldErrors => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(
    v => Array.isArray(v) && v.every(item => typeof item === 'string'),
  );
};

/**
 * 예외 메시지 추출
 * @description 메시지/코드/필드별 에러를 구성
 */
const extractErrorMessage = (exception: HttpException): { message: string; code?: string; errors?: FieldErrors } => {
  const exceptionResponse = exception.getResponse();

  if (typeof exceptionResponse === 'string') {
    return { message: exceptionResponse };
  }

  if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
    const messageValue = (exceptionResponse as { message?: unknown }).message;
    const codeValue = (exceptionResponse as { code?: unknown }).code;
    const errorsValue = (exceptionResponse as { errors?: unknown }).errors;
    if (typeof messageValue === 'string') {
      return {
        message: messageValue,
        ...(typeof codeValue === 'string' ? { code: codeValue } : {}),
        ...(isFieldErrors(errorsValue) ? { errors: errorsValue } : {}),
      };
    }
  }

  return { message: exception.message };
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 예외 처리
   * @description 표준 응답으로 변환 후 반환
   */
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
    const { message: errorMessage, code, errors } = extractErrorMessage(exception);

    // 에러 로그 출력
    this.logger.error(
      `Error to ${request.method} ${request.url} ${paramMessage} ${queryMessage} ${bodyMessage}\n` +
        `statusCode : ${status}\n` +
        `message : ${JSON.stringify(errorMessage, null, 2)}${code ? `\ncode : ${code}` : ''}`,
    );

    // 표준 에러 응답
    const payload: StandardErrorResponse = {
      statusCode: status,
      message: errorMessage,
      ...(code ? { code } : {}),
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}

/**
 * 예외 필터 설정
 * @description 전역 예외 필터를 등록
 */
export const setupFilters = (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
};
