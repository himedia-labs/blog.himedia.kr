import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { PasswordReset } from '../entities/passwordReset.entity';
import { EmailService } from '../../email/email.service';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { VerifyResetCodeDto } from '../dto/verifyResetCode.dto';
import { ResetPasswordWithCodeDto } from '../dto/resetPasswordWithCode.dto';
import {
  AUTH_CONFIG,
  AUTH_ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES,
} from '../auth.constants';
import type { HashFunction } from '../interfaces/auth.interface';

const { hash: hashPassword } = bcrypt as {
  hash: HashFunction;
};

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly emailService: EmailService,
  ) {}

  async sendPasswordResetCode(dto: ForgotPasswordDto) {
    const user = await this.getUserByEmailOrThrow(dto.email);

    const code = this.generateResetCode();
    const expiresAt = new Date(
      Date.now() + AUTH_CONFIG.RESET_CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      code,
      expiresAt,
      used: false,
    });

    await this.passwordResetRepository.save(passwordReset);
    await this.emailService.sendPasswordResetCode(user.email, code);

    return { success: true, message: AUTH_SUCCESS_MESSAGES.RESET_CODE_SENT };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    await this.validatePasswordResetCode(dto.email, dto.code);
    return {
      success: true,
      message: AUTH_SUCCESS_MESSAGES.RESET_CODE_VERIFIED,
    };
  }

  async resetPasswordWithCode(dto: ResetPasswordWithCodeDto) {
    const { user, resetRecord } = await this.validatePasswordResetCode(
      dto.email,
      dto.code,
    );

    user.password = await hashPassword(
      dto.newPassword,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );
    await this.usersRepository.save(user);

    resetRecord.used = true;
    await this.passwordResetRepository.save(resetRecord);

    return { success: true, message: AUTH_SUCCESS_MESSAGES.PASSWORD_CHANGED };
  }

  private async getUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.EMAIL_NOT_FOUND);
    }

    return user;
  }

  private async validatePasswordResetCode(
    email: string,
    code: string,
  ): Promise<{ user: User; resetRecord: PasswordReset }> {
    const user = await this.getUserByEmailOrThrow(email);

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

    if (!resetRecord) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_RESET_CODE);
    }

    if (resetRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.EXPIRED_RESET_CODE);
    }

    return { user, resetRecord };
  }

  private generateResetCode(): string {
    const chars = AUTH_CONFIG.RESET_CODE_CHARSET;
    const length = AUTH_CONFIG.RESET_CODE_LENGTH;
    let code = '';
    for (let i = 0; i < length; i += 1) {
      const index = randomInt(0, chars.length);
      code += chars[index];
    }
    return code;
  }
}
