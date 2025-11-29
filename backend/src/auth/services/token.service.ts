import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';

import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refreshToken.entity';

import { UserService } from './user.service';
import appConfig from '../../common/config/app.config';
import { RefreshTokenDto } from '../dto/refreshToken.dto';
import { comparePassword, hashPassword } from '../utils/bcrypt.util';

import { AUTH_CONFIG } from '../../constants/config/auth.config';
import { TOKEN_CONFIG } from '../../constants/config/token.config';
import { TOKEN_ERROR_MESSAGES } from '../../constants/message/token.messages';

import type { AuthTokens, AuthResponse } from '../interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly userService: UserService,
  ) {}

  /**
   * 토큰 생성
   * @description Access Token과 Refresh Token을 함께 생성
   */
  async generateTokens(user: User, userAgent?: string, ipAddress?: string): Promise<AuthTokens> {
    // Access Token 생성
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    // Refresh Token 생성
    const refreshToken = await this.createRefreshToken(user, userAgent, ipAddress);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh Token 생성
   * @description UUID + 랜덤 시크릿으로 구성된 Refresh Token 생성
   */
  async createRefreshToken(user: User, userAgent?: string, ipAddress?: string): Promise<string> {
    // UUID 생성
    const tokenId = randomUUID();

    // 랜덤 시크릿 생성
    const secret = randomBytes(TOKEN_CONFIG.REFRESH_TOKEN_SECRET_LENGTH).toString('hex');

    // 만료 시간 설정
    const expiresAt = this.getRefreshTokenExpiryDate();

    // 토큰 엔티티 생성
    const refreshToken = this.refreshTokensRepository.create({
      id: tokenId,
      tokenHash: await hashPassword(secret, AUTH_CONFIG.BCRYPT_ROUNDS),
      expiresAt,
      userId: user.id,
      user,
      revokedAt: null,
      userAgent: userAgent,
      ipAddress: ipAddress,
    });

    // DB 저장
    await this.refreshTokensRepository.save(refreshToken);

    // "tokenId.secret" 형식 반환
    return `${tokenId}.${secret}`;
  }

  /**
   * 토큰 갱신
   * @description Refresh Token 검증 후 기존 토큰 무효화하고 새 토큰 발급
   */
  async refreshTokens(
    { refreshToken }: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    // 토큰 검증
    const storedToken = await this.getValidatedRefreshToken(refreshToken);

    // 사용자 조회
    const user = await this.userService.getUserByIdOrThrow(storedToken.userId);

    // 보안: 기존 토큰 무효화
    await this.revokeToken(storedToken);

    // 새 토큰 및 프로필 반환
    return this.buildAuthResponseForUser(user, userAgent, ipAddress);
  }

  /**
   * 로그아웃
   * @description Refresh Token을 무효화 처리
   */
  async logout({ refreshToken }: RefreshTokenDto) {
    // 토큰 조회
    const storedToken = await this.getRefreshToken(refreshToken);

    // 토큰 무효화
    if (storedToken) {
      await this.revokeToken(storedToken);
    }

    return { success: true };
  }

  /**
   * Refresh Token 검증
   * @description 토큰 유효성을 검증하고 반환
   */
  async getValidatedRefreshToken(refreshToken: string): Promise<RefreshToken> {
    // 토큰 파싱
    const parsed = this.parseRefreshToken(refreshToken);

    // 토큰 조회
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { id: parsed.tokenId },
    });

    // 토큰 없음 또는 무효화됨
    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException(TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // 토큰 만료
    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(TOKEN_ERROR_MESSAGES.EXPIRED_REFRESH_TOKEN);
    }

    // 시크릿 검증
    const isMatch = await comparePassword(parsed.secret, storedToken.tokenHash);

    // 시크릿 불일치
    if (!isMatch) {
      throw new UnauthorizedException(TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return storedToken;
  }

  /**
   * Refresh Token 조회
   * @description 검증 없이 토큰만 조회
   */
  async getRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
    try {
      // 토큰 파싱
      const parsed = this.parseRefreshToken(refreshToken);

      // 토큰 조회
      return this.refreshTokensRepository.findOne({
        where: { id: parsed.tokenId },
      });
    } catch {
      return null;
    }
  }

  /**
   * 토큰 무효화
   * @description 특정 Refresh Token을 무효화
   */
  async revokeToken(token: RefreshToken): Promise<void> {
    // 무효화 시간 설정
    token.revokedAt = new Date();

    // DB 저장
    await this.refreshTokensRepository.save(token);
  }

  /**
   * 사용자 토큰 전체 무효화
   * @description 특정 사용자의 모든 Refresh Token을 무효화
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // 모든 토큰 조회
    const tokens = await this.refreshTokensRepository.find({
      where: { userId },
    });

    // 토큰 없음
    if (!tokens.length) {
      return;
    }

    // 모든 토큰 무효화
    const now = new Date();
    await this.refreshTokensRepository.save(
      tokens.map(token => ({
        ...token,
        revokedAt: token.revokedAt ?? now,
      })),
    );
  }

  /**
   * 인증 응답 생성
   * @description 사용자 프로필과 토큰을 포함한 응답 객체 생성
   */
  async buildAuthResponseForUser(user: User, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // 프로필 생성
    const profile = this.userService.buildUserProfile(user);

    // 토큰 생성
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      ...tokens,
      user: profile,
    };
  }

  /**
   * Refresh Token 파싱
   * @description "tokenId.secret" 형식을 분리
   */
  private parseRefreshToken(refreshToken: string): {
    tokenId: string;
    secret: string;
  } {
    // "." 기준 분리
    const [tokenId, secret] = refreshToken.split('.');

    // 형식 오류
    if (!tokenId || !secret) {
      throw new UnauthorizedException(TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { tokenId, secret };
  }

  /**
   * Refresh Token 만료 시간 계산
   * @description Type-safe하게 환경변수 기반으로 만료일 계산
   */
  private getRefreshTokenExpiryDate(): Date {
    // 만료 일수 조회
    const configuredDays = this.config.jwt.refreshExpiresInDays;

    // 만료 시간 계산 (일 → 밀리초)
    return new Date(Date.now() + configuredDays * 24 * 60 * 60 * 1000);
  }
}
