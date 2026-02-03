import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ChangePasswordDto } from '@/auth/dto/changePassword.dto';

import { UserService } from '@/auth/services/user.service';
import { TokenService } from '@/auth/services/token.service';

import { User } from '@/auth/entities/user.entity';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { AUTH_ERROR_MESSAGES } from '@/constants/message/auth.messages';

import { comparePassword, hashWithAuthRounds } from '@/auth/utils/bcrypt.util';

import type { AuthResponse } from '@/auth/interfaces/auth.interface';

/**
 * 비밀번호 변경 서비스
 * @description 인증된 사용자 비밀번호 변경
 */
@Injectable()
export class PasswordChangeService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
      throw new UnauthorizedException({
        message: AUTH_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD,
        code: ERROR_CODES.AUTH_INVALID_CURRENT_PASSWORD,
      });
    }

    // 새 비밀번호 해싱
    user.password = await hashWithAuthRounds(dto.newPassword);

    // DB 저장
    await this.usersRepository.save(user);

    // 모든 토큰 무효화
    await this.tokenService.revokeAllUserTokens(user.id);

    // 새 토큰 및 프로필 반환
    return this.tokenService.buildAuthResponseForUser(user, userAgent, ipAddress);
  }
}
