import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { COMMON_VALIDATION_MESSAGES } from '@/constants/message/common.messages';

import type { ValidationError } from 'class-validator';

/**
 * 전역 ValidationPipe 설정
 * @description DTO 검증 실패 시 표준 응답 반환
 */
export const setupValidation = (app: INestApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const fieldErrors = errors.reduce<Record<string, string[]>>((acc, err) => {
          const constraints = Object.values(err.constraints ?? {}).filter(Boolean);
          if (constraints.length) {
            acc[err.property] = constraints;
          }
          return acc;
        }, {});

        const messages = Object.values(fieldErrors).flat();

        return new BadRequestException({
          message: messages.length ? messages.join(', ') : COMMON_VALIDATION_MESSAGES.UNKNOWN,
          code: ERROR_CODES.VALIDATION_FAILED,
          errors: fieldErrors,
        });
      },
    }),
  );
};
