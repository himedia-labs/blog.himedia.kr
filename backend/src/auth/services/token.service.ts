import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refreshToken.entity';
import { AUTH_CONFIG, AUTH_ERROR_MESSAGES } from '../auth.constants';
import { getRequiredEnv } from '../../common/exception/config.exception';
import type {
  AuthTokens,
  CompareFunction,
  HashFunction,
} from '../interfaces/auth.interface';

const { hash: hashPassword, compare: comparePassword } = bcrypt as {
  hash: HashFunction;
  compare: CompareFunction;
};

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = await this.createRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async createRefreshToken(user: User): Promise<string> {
    const tokenId = randomUUID();
    const secret = randomBytes(AUTH_CONFIG.REFRESH_TOKEN_SECRET_LENGTH).toString(
      'hex',
    );
    const expiresAt = this.getRefreshTokenExpiryDate();

    const refreshToken = this.refreshTokensRepository.create({
      id: tokenId,
      tokenHash: await hashPassword(secret, AUTH_CONFIG.BCRYPT_ROUNDS),
      expiresAt,
      userId: user.id,
      user,
      revokedAt: null,
    });

    await this.refreshTokensRepository.save(refreshToken);

    return `${tokenId}.${secret}`;
  }

  async getValidatedRefreshToken(refreshToken: string): Promise<RefreshToken> {
    const parsed = this.parseRefreshToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { id: parsed.tokenId },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.EXPIRED_REFRESH_TOKEN);
    }

    const isMatch = await comparePassword(parsed.secret, storedToken.tokenHash);

    if (!isMatch) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return storedToken;
  }

  async getRefreshToken(
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    try {
      const parsed = this.parseRefreshToken(refreshToken);
      return this.refreshTokensRepository.findOne({
        where: { id: parsed.tokenId },
      });
    } catch {
      return null;
    }
  }

  async revokeToken(token: RefreshToken): Promise<void> {
    token.revokedAt = new Date();
    await this.refreshTokensRepository.save(token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokensRepository.find({
      where: { userId },
    });

    if (!tokens.length) {
      return;
    }

    const now = new Date();
    await this.refreshTokensRepository.save(
      tokens.map((token) => ({
        ...token,
        revokedAt: token.revokedAt ?? now,
      })),
    );
  }

  private parseRefreshToken(refreshToken: string): {
    tokenId: string;
    secret: string;
  } {
    const [tokenId, secret] = refreshToken.split('.');

    if (!tokenId || !secret) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { tokenId, secret };
  }

  private getRefreshTokenExpiryDate(): Date {
    const value = getRequiredEnv(
      this.configService,
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
    );

    const configuredDays = Number(value);

    return new Date(Date.now() + configuredDays * 24 * 60 * 60 * 1000);
  }
}
