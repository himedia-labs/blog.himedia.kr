import { randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { ForgotPasswordDto } from '@/auth/dto/forgotPassword.dto';
import { VerifyResetCodeDto } from '@/auth/dto/verifyResetCode.dto';
import { ResetPasswordWithCodeDto } from '@/auth/dto/resetPasswordWithCode.dto';

import { UserService } from '@/auth/services/user.service';
import { TokenService } from '@/auth/services/token.service';

import { User } from '@/auth/entities/user.entity';
import { PasswordReset } from '@/auth/entities/passwordReset.entity';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { PASSWORD_CONFIG } from '@/constants/config/password.config';
import { EmailService } from '@/email/email.service';
import { SnowflakeService } from '@/common/services/snowflake.service';
import { PASSWORD_ERROR_MESSAGES, PASSWORD_SUCCESS_MESSAGES } from '@/constants/message/password.messages';

import { comparePassword, hashWithAuthRounds } from '@/auth/utils/bcrypt.util';

import type { PasswordResetValidation } from '@/auth/interfaces/password.interface';

/**
 * 비밀번호 재설정 서비스
 * @description 인증번호 발송/검증 및 코드로 비밀번호 재설정
 */
@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 비밀번호 재설정 코드 전송
   * @description 이메일로 8자리 인증 코드 발송 (10분 유효)
   */
  async sendPasswordResetCode(dto: ForgotPasswordDto): Promise<{ success: true; message: string }> {
    // 사용자 조회 (존재하지 않아도 동일 응답으로 처리해 열거 방지)
    const user = await this.userService.findUserByEmail(dto.email);
    if (!user) {
      return { success: true, message: PASSWORD_SUCCESS_MESSAGES.RESET_CODE_SENT };
    }
    const now = new Date();

    // 이전에 발급된 미사용 코드가 있다면 모두 무효화
    await this.passwordResetRepository.update(
      {
        userId: user.id,
        used: false,
        expiresAt: MoreThanOrEqual(now),
      },
      { used: true },
    );

    // 인증 코드 생성 및 해싱
    const { code, hashedCode } = await this.generateAndHashResetCode();

    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + PASSWORD_CONFIG.RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Snowflake ID 생성
    const id = this.snowflakeService.generate();

    // 재설정 레코드 생성
    const passwordReset = this.passwordResetRepository.create({
      id,
      userId: user.id,
      code: hashedCode,
      expiresAt,
      used: false,
    });

    // DB 저장
    await this.passwordResetRepository.save(passwordReset);

    // 이메일 발송
    try {
      await this.emailService.sendPasswordResetCode(user.email, code);
    } catch {
      throw new InternalServerErrorException({
        message: PASSWORD_ERROR_MESSAGES.EMAIL_SEND_FAILED,
        code: ERROR_CODES.EMAIL_SEND_FAILED,
      });
    }

    return { success: true, message: PASSWORD_SUCCESS_MESSAGES.RESET_CODE_SENT };
  }

  /**
   * 재설정 코드 검증
   * @description 인증 코드 유효성 확인
   */
  async verifyResetCode(dto: VerifyResetCodeDto): Promise<{ success: true; message: string }> {
    // 이메일+코드 유효성 검증
    await this.validatePasswordResetCode(dto.email, dto.code);

    return {
      success: true,
      message: PASSWORD_SUCCESS_MESSAGES.RESET_CODE_VERIFIED,
    };
  }

  /**
   * 코드로 비밀번호 재설정
   * @description 인증 코드 확인 후 새 비밀번호로 변경
   */
  async resetPasswordWithCode(dto: ResetPasswordWithCodeDto): Promise<{ success: true; message: string }> {
    // 코드 검증
    const { user, resetRecord } = await this.validatePasswordResetCode(dto.email, dto.code);

    // 비밀번호 변경 + 코드 사용 처리를 트랜잭션으로 수행
    await this.usersRepository.manager.transaction(async manager => {
      user.password = await hashWithAuthRounds(dto.newPassword);
      resetRecord.used = true;

      await manager.save(user);
      await manager.save(resetRecord);
    });

    // 모든 토큰 무효화
    await this.tokenService.revokeAllUserTokens(user.id);

    return { success: true, message: PASSWORD_SUCCESS_MESSAGES.PASSWORD_CHANGED };
  }

  /**
   * 8자리 인증 코드 생성 + 해시 생성 헬퍼 함수
   */
  private async generateAndHashResetCode(): Promise<{ code: string; hashedCode: string }> {
    const code = this.generateResetCode();
    const hashedCode = await hashWithAuthRounds(code);
    return { code, hashedCode };
  }

  /**
   * 재설정 코드 검증
   * @description 이메일과 코드로 유효성 확인
   */
  private async validatePasswordResetCode(email: string, code: string): Promise<PasswordResetValidation> {
    // 사용자 조회 (존재하지 않으면 동일 에러로 응답)
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        message: PASSWORD_ERROR_MESSAGES.INVALID_RESET_CODE,
        code: ERROR_CODES.PASSWORD_INVALID_RESET_CODE,
      });
    }
    const now = new Date();

    // 만료된 코드 사용 처리
    await this.passwordResetRepository.update(
      {
        userId: user.id,
        used: false,
        expiresAt: LessThan(now),
      },
      { used: true },
    );

    // 유효(미사용+만료 전) 코드 조회
    const resetRecords = await this.passwordResetRepository.find({
      where: {
        userId: user.id,
        used: false,
        expiresAt: MoreThanOrEqual(now),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // 코드 없음
    if (!resetRecords.length) {
      throw new UnauthorizedException({
        message: PASSWORD_ERROR_MESSAGES.INVALID_RESET_CODE,
        code: ERROR_CODES.PASSWORD_INVALID_RESET_CODE,
      });
    }

    // 코드 해시 검증
    let resetRecord: PasswordReset | null = null;
    for (const record of resetRecords) {
      const isMatch = await comparePassword(code, record.code);
      if (isMatch) {
        resetRecord = record;
        break;
      }
    }

    // 코드 불일치
    if (!resetRecord) {
      throw new UnauthorizedException({
        message: PASSWORD_ERROR_MESSAGES.INVALID_RESET_CODE,
        code: ERROR_CODES.PASSWORD_INVALID_RESET_CODE,
      });
    }

    return { user, resetRecord };
  }

  /**
   * 재설정 코드 생성
   * @description 8자리 랜덤 코드 생성
   */
  private generateResetCode(): string {
    const chars = PASSWORD_CONFIG.RESET_CODE_CHARSET;
    const length = PASSWORD_CONFIG.RESET_CODE_LENGTH;
    let code = '';

    // 랜덤 문자 생성
    for (let i = 0; i < length; i += 1) {
      const index = randomInt(0, chars.length);
      code += chars[index];
    }

    return code;
  }
}
