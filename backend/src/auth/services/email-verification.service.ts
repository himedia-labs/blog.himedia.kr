import { randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { SendEmailVerificationCodeDto } from '@/auth/dto/sendEmailVerificationCode.dto';
import { VerifyEmailVerificationCodeDto } from '@/auth/dto/verifyEmailVerificationCode.dto';

import { UserService } from '@/auth/services/user.service';

import { EmailVerification } from '@/auth/entities/emailVerification.entity';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { EmailService } from '@/email/email.service';
import { SnowflakeService } from '@/common/services/snowflake.service';
import { AUTH_ERROR_MESSAGES } from '@/constants/message/auth.messages';
import { EMAIL_VERIFICATION_CONFIG } from '@/constants/config/email-verification.config';
import {
  EMAIL_VERIFICATION_ERROR_MESSAGES,
  EMAIL_VERIFICATION_SUCCESS_MESSAGES,
} from '@/constants/message/email-verification.messages';

import { comparePassword, hashWithAuthRounds } from '@/auth/utils/bcrypt.util';

import type { EmailVerificationValidation } from '@/auth/interfaces/emailVerification.interface';

/**
 * 이메일 인증 서비스
 * @description 회원가입 이메일 인증번호 발송/검증 처리
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 이메일 인증 코드 전송
   * @description 회원가입 이메일 인증번호를 발송
   */
  async sendEmailVerificationCode(dto: SendEmailVerificationCodeDto): Promise<{ success: true; message: string }> {
    const purpose = dto.purpose === 'account-change' ? 'account-change' : 'register';

    // 사용자/검증
    const existingUser = await this.userService.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
      });
    }

    // 코드/무효화
    const now = new Date();
    await this.emailVerificationRepository.update(
      {
        email: dto.email,
        used: false,
        expiresAt: MoreThanOrEqual(now),
      },
      { used: true },
    );

    // 코드/생성
    const id = this.snowflakeService.generate();
    const { code, hashedCode } = await this.generateAndHashVerificationCode();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CONFIG.CODE_EXPIRY_MINUTES * 60 * 1000);

    // 코드/저장
    const emailVerification = this.emailVerificationRepository.create({
      id,
      email: dto.email,
      code: hashedCode,
      expiresAt,
      used: false,
    });
    await this.emailVerificationRepository.save(emailVerification);

    // 이메일/발송
    try {
      await this.emailService.sendEmailVerificationCode(dto.email, code, purpose);
    } catch {
      throw new InternalServerErrorException({
        message: EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_SEND_FAILED,
        code: ERROR_CODES.EMAIL_SEND_FAILED,
      });
    }

    return { success: true, message: EMAIL_VERIFICATION_SUCCESS_MESSAGES.CODE_SENT };
  }

  /**
   * 이메일 인증 코드 검증
   * @description 회원가입 인증번호 유효성 확인
   */
  async verifyEmailVerificationCode(dto: VerifyEmailVerificationCodeDto): Promise<{ success: true; message: string }> {
    // 코드/검증
    const { verification } = await this.validateEmailVerificationCode(dto.email, dto.code);

    verification.used = true;
    await this.emailVerificationRepository.save(verification);

    return { success: true, message: EMAIL_VERIFICATION_SUCCESS_MESSAGES.CODE_VERIFIED };
  }

  /**
   * 인증 코드 생성 + 해시 생성
   * @description 이메일 인증번호를 생성하고 해시 처리
   */
  private async generateAndHashVerificationCode(): Promise<{ code: string; hashedCode: string }> {
    const code = this.generateVerificationCode();
    const hashedCode = await hashWithAuthRounds(code);
    return { code, hashedCode };
  }

  /**
   * 이메일 인증 코드 검증
   * @description 이메일과 인증번호로 유효성 확인
   */
  private async validateEmailVerificationCode(
    email: string,
    code: string,
  ): Promise<EmailVerificationValidation> {
    // 사용자/검증
    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException({
        message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
      });
    }

    // 코드/만료 처리
    const now = new Date();
    await this.emailVerificationRepository.update(
      {
        email,
        used: false,
        expiresAt: LessThan(now),
      },
      { used: true },
    );

    // 코드/조회
    const verificationRecords = await this.emailVerificationRepository.find({
      where: {
        email,
        used: false,
        expiresAt: MoreThanOrEqual(now),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!verificationRecords.length) {
      throw new UnauthorizedException({
        message: EMAIL_VERIFICATION_ERROR_MESSAGES.INVALID_CODE,
        code: ERROR_CODES.EMAIL_INVALID_VERIFICATION_CODE,
      });
    }

    // 코드/검증
    let verification: EmailVerification | null = null;
    for (const record of verificationRecords) {
      const isMatch = await comparePassword(code, record.code);
      if (isMatch) {
        verification = record;
        break;
      }
    }

    if (!verification) {
      throw new UnauthorizedException({
        message: EMAIL_VERIFICATION_ERROR_MESSAGES.INVALID_CODE,
        code: ERROR_CODES.EMAIL_INVALID_VERIFICATION_CODE,
      });
    }

    return { verification };
  }

  /**
   * 인증 코드 생성
   * @description 8자리 랜덤 코드 생성
   */
  private generateVerificationCode(): string {
    let code = '';
    const length = EMAIL_VERIFICATION_CONFIG.CODE_LENGTH;
    const chars = EMAIL_VERIFICATION_CONFIG.CODE_CHARSET;

    // 랜덤/생성
    for (let i = 0; i < length; i += 1) {
      const index = randomInt(0, chars.length);
      code += chars[index];
    }

    return code;
  }
}
