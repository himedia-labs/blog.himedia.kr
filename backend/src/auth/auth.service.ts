import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ChangePasswordDto } from './dto/resetPassword.dto';
import { RefreshToken } from './entities/refreshToken.entity';
import type {
  AuthResponse,
  AuthTokens,
  AuthUserProfile,
} from './interfaces/auth.interface';
import type {
  CompareFunction,
  HashFunction,
} from './interfaces/bcrypt.interface';
import { getRequiredEnv } from '../common/exception/config.exception';

const { hash: hashPassword, compare: comparePassword } = bcrypt as {
  hash: HashFunction;
  compare: CompareFunction;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(user: User): Promise<AuthResponse> {
    return this.buildAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const password = await hashPassword(registerDto.password, 10);
    const userEntity = this.usersRepository.create({
      ...registerDto,
      password,
    });
    const savedUser = await this.usersRepository.save(userEntity);

    return this.buildAuthResponse(savedUser);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async refreshTokens({
    refreshToken,
  }: RefreshTokenDto): Promise<AuthResponse> {
    const storedToken = await this.getValidatedRefreshToken(refreshToken);
    const user = await this.usersRepository.findOne({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    await this.revokeToken(storedToken);
    return this.buildAuthResponse(user);
  }

  async logout({ refreshToken }: RefreshTokenDto) {
    const storedToken = await this.getRefreshToken(refreshToken);

    if (storedToken) {
      await this.revokeToken(storedToken);
    }

    return { success: true };
  }

  async resetPassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<AuthResponse> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const isValid = await comparePassword(dto.currentPassword, user.password);

    if (!isValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    user.password = await hashPassword(dto.newPassword, 10);
    await this.usersRepository.save(user);
    await this.revokeAllUserTokens(user.id);

    return this.buildAuthResponse(user);
  }

  async getProfileById(userId: string): Promise<AuthUserProfile> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return this.buildUserProfile(user);
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const profile = this.buildUserProfile(user);
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: profile,
    };
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = await this.createRefreshToken(user);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(user: User) {
    const tokenId = randomUUID();
    const secret = randomBytes(32).toString('hex');
    const expiresAt = this.getRefreshTokenExpiryDate();

    const refreshToken = this.refreshTokensRepository.create({
      id: tokenId,
      tokenHash: await hashPassword(secret, 10),
      expiresAt,
      userId: user.id,
      user,
      revokedAt: null,
    });

    await this.refreshTokensRepository.save(refreshToken);

    return `${tokenId}.${secret}`;
  }

  private getRefreshTokenExpiryDate() {
    const value = getRequiredEnv(
      this.configService,
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
    );

    const configuredDays = Number(value);

    return new Date(Date.now() + configuredDays * 24 * 60 * 60 * 1000);
  }

  private async getValidatedRefreshToken(refreshToken: string) {
    const parsed = this.parseRefreshToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { id: parsed.tokenId },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
    }

    const isMatch = await comparePassword(parsed.secret, storedToken.tokenHash);

    if (!isMatch) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    return storedToken;
  }

  private async getRefreshToken(refreshToken: string) {
    try {
      const parsed = this.parseRefreshToken(refreshToken);
      return this.refreshTokensRepository.findOne({
        where: { id: parsed.tokenId },
      });
    } catch {
      return null;
    }
  }

  private parseRefreshToken(refreshToken: string) {
    const [tokenId, secret] = refreshToken.split('.');

    if (!tokenId || !secret) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    return { tokenId, secret };
  }

  private async revokeToken(token: RefreshToken) {
    token.revokedAt = new Date();
    await this.refreshTokensRepository.save(token);
  }

  private async revokeAllUserTokens(userId: string) {
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

  private buildUserProfile(user: User): AuthUserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      course: user.course ?? null,
    };
  }
}
