import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from './user.service';
import { TokenService } from './token.service';
import { EmailService } from '../../email/email.service';

import { User } from '../entities/user.entity';
import { PasswordReset } from '../entities/passwordReset.entity';

import { ChangePasswordDto } from '../dto/changePassword.dto';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { VerifyResetCodeDto } from '../dto/verifyResetCode.dto';
import { ResetPasswordWithCodeDto } from '../dto/resetPasswordWithCode.dto';

import { AUTH_CONFIG } from '../../constants/config/auth.config';
import { PASSWORD_CONFIG } from '../../constants/config/password.config';
import { AUTH_ERROR_MESSAGES } from '../../constants/message/auth.messages';
import { PASSWORD_ERROR_MESSAGES, PASSWORD_SUCCESS_MESSAGES } from '../../constants/message/password.messages';

import { comparePassword, hashPassword } from '../utils/bcrypt.util';

import type { AuthResponse } from '../interfaces/auth.interface';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  /**
   * 비밀번호 변경
   * @description 현재 비밀번호 검증 후 새 비밀번호로 변경하고 모든 토큰 무효화
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    // 사용자 조회
    const user = await this.userService.getUserByIdOrThrow(userId);

    // 현재 비밀번호 검증
    const isValid = await comparePassword(dto.currentPassword, user.password);

    // 비밀번호 불일치
    if (!isValid) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    // 새 비밀번호 해싱
    user.password = await hashPassword(dto.newPassword, AUTH_CONFIG.BCRYPT_ROUNDS);

    // DB 저장
    await this.usersRepository.save(user);

    // 모든 토큰 무효화
    await this.tokenService.revokeAllUserTokens(user.id);

    // 새 토큰 및 프로필 반환
    return this.tokenService.buildAuthResponseForUser(user, userAgent, ipAddress);
  }

  /**
   * 비밀번호 재설정 코드 전송
   * @description 이메일로 8자리 인증 코드 발송 (10분 유효)
   */
  async sendPasswordResetCode(dto: ForgotPasswordDto) {
    // 사용자 조회
    const user = await this.userService.getUserByEmailOrThrow(dto.email);

    // 인증 코드 생성
    const code = this.generateResetCode();

    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + PASSWORD_CONFIG.RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

    // 재설정 레코드 생성
    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      code,
      expiresAt,
      used: false,
    });

    // DB 저장
    await this.passwordResetRepository.save(passwordReset);

    // 이메일 발송
    await this.emailService.sendPasswordResetCode(user.email, code);

    return { success: true, message: PASSWORD_SUCCESS_MESSAGES.RESET_CODE_SENT };
  }

  /**
   * 재설정 코드 검증
   * @description 인증 코드 유효성 확인
   */
  async verifyResetCode(dto: VerifyResetCodeDto) {
    // 코드 유효성 검증
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
  async resetPasswordWithCode(dto: ResetPasswordWithCodeDto) {
    // 코드 검증
    const { user, resetRecord } = await this.validatePasswordResetCode(dto.email, dto.code);

    // 새 비밀번호 해싱
    user.password = await hashPassword(dto.newPassword, AUTH_CONFIG.BCRYPT_ROUNDS);

    // DB 저장
    await this.usersRepository.save(user);

    // 코드 사용 완료 처리
    resetRecord.used = true;
    await this.passwordResetRepository.save(resetRecord);

    return { success: true, message: PASSWORD_SUCCESS_MESSAGES.PASSWORD_CHANGED };
  }

  /**
   * 재설정 코드 검증
   * @description 이메일과 코드로 유효성 확인
   */
  private async validatePasswordResetCode(
    email: string,
    code: string,
  ): Promise<{ user: User; resetRecord: PasswordReset }> {
    // 사용자 조회
    const user = await this.userService.getUserByEmailOrThrow(email);

    // 최근 미사용 코드 조회
    const resetRecord = await this.passwordResetRepository.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // 코드 없음
    if (!resetRecord) {
      throw new UnauthorizedException(PASSWORD_ERROR_MESSAGES.INVALID_RESET_CODE);
    }

    // 코드 만료
    if (resetRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(PASSWORD_ERROR_MESSAGES.EXPIRED_RESET_CODE);
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
