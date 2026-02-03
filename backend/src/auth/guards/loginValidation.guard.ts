import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from '@/auth/dto/login.dto';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { COMMON_VALIDATION_MESSAGES } from '@/constants/message/common.messages';

import type { Request } from 'express';
import type { ValidationError } from 'class-validator';

/**
 * 로그인 DTO 검증 가드
 * @description Guard 실행 전에 로그인 요청 바디를 검증합니다.
 */
@Injectable()
export class LoginValidationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const dto = plainToInstance(LoginDto, request.body ?? {});

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (!errors.length) return true;

    const fieldErrors = errors.reduce<Record<string, string[]>>((acc, err: ValidationError) => {
      const constraints = Object.values(err.constraints ?? {}).filter(Boolean);
      if (constraints.length) {
        acc[err.property] = constraints;
      }
      return acc;
    }, {});

    const messages = Object.values(fieldErrors).flat();
    throw new BadRequestException({
      message: messages.length ? messages.join(', ') : COMMON_VALIDATION_MESSAGES.UNKNOWN,
      code: ERROR_CODES.VALIDATION_FAILED,
      errors: fieldErrors,
    });
  }
}
