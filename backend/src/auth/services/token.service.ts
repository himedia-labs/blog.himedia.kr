import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { randomBytes, randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refreshToken.entity';

import appConfig from '../../common/config/app.config';
import { TOKEN_CONFIG } from '../../constants/config/token.config';

import { UserService } from './user.service';
import { RefreshTokenDto } from '../dto/refreshToken.dto';
import { ERROR_CODES } from '../../constants/error/error-codes';
import { TOKEN_ERROR_MESSAGES } from '../../constants/message/token.messages';
import { hashRefreshTokenSecret, verifyRefreshTokenSecret } from '../utils/token-hash.util';

import type { ConfigType } from '@nestjs/config';
import type { AuthResponse } from '../interfaces/auth.interface';
import type { AuthTokens, ParsedRefreshToken } from '../interfaces/token.interface';

/**
 * 토큰 관리 서비스
 * @description Access Token 및 Refresh Token의 생성, 검증, 무효화 처리
 */
@Injectable()
export class TokenService {
  private readonly config: ConfigType<typeof appConfig>;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,

    @Inject(appConfig.KEY) config: ConfigType<typeof appConfig>,
    private readonly userService: UserService,
  ) {
    this.config = config;
  }

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
      tokenHash: hashRefreshTokenSecret(secret, this.config.jwt.refreshTokenHashSecret),
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
  async logout({ refreshToken }: RefreshTokenDto): Promise<{ success: true }> {
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
      throw new UnauthorizedException({
        message: TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        code: ERROR_CODES.TOKEN_INVALID_REFRESH_TOKEN,
      });
    }

    // 토큰 만료
    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        message: TOKEN_ERROR_MESSAGES.EXPIRED_REFRESH_TOKEN,
        code: ERROR_CODES.TOKEN_EXPIRED_REFRESH_TOKEN,
      });
    }

    // 시크릿 검증
    const isMatch = await verifyRefreshTokenSecret(
      parsed.secret,
      storedToken.tokenHash,
      this.config.jwt.refreshTokenHashSecret,
    );

    // 시크릿 불일치
    if (!isMatch) {
      throw new UnauthorizedException({
        message: TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        code: ERROR_CODES.TOKEN_INVALID_REFRESH_TOKEN,
      });
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
    // 모든 토큰 무효화
    const now = new Date();
    await this.refreshTokensRepository.update({ userId, revokedAt: IsNull() }, { revokedAt: now });
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
  private parseRefreshToken(refreshToken: string): ParsedRefreshToken {
    // 정상적인 토큰인지 검사
    const parts = refreshToken.split('.');

    if (parts.length !== 2) {
      throw new UnauthorizedException({
        message: TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        code: ERROR_CODES.TOKEN_INVALID_REFRESH_TOKEN,
      });
    }

    const [tokenId, secret] = parts;

    // 빈 문자열 체크
    if (!tokenId || !secret) {
      throw new UnauthorizedException({
        message: TOKEN_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        code: ERROR_CODES.TOKEN_INVALID_REFRESH_TOKEN,
      });
    }

    return { tokenId, secret };
  }

  /**
   * Refresh Token 만료 시간 계산
   * @description Type-safe하게 환경변수 기반으로 만료일 계산
   */
  private getRefreshTokenExpiryDate(): Date {
    // 만료 시간 조회
    const expiresInSeconds = this.config.jwt.refreshExpiresInSeconds;

    // 만료 시간 계산 (초 > 밀리초)
    return new Date(Date.now() + expiresInSeconds * 1000);
  }
}
