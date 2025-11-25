import * as bcrypt from 'bcryptjs';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../entities/user.entity';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refreshToken.dto';
import { ChangePasswordDto } from '../dto/changePassword.dto';
import { AUTH_CONFIG, AUTH_ERROR_MESSAGES } from '../auth.constants';

import type {
  AuthResponse,
  AuthUserProfile,
} from '../interfaces/auth.interface';
import type {
  CompareFunction,
  HashFunction,
} from '../interfaces/bcrypt.interface';

const { hash: hashPassword, compare: comparePassword } = bcrypt as {
  hash: HashFunction;
  compare: CompareFunction;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
  ) {}

  async login(user: User): Promise<AuthResponse> {
    return this.buildAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const password = await hashPassword(
      registerDto.password,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );
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
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.approved) {
      throw new UnauthorizedException('관리자 승인 대기 중입니다.');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  async refreshTokens({
    refreshToken,
  }: RefreshTokenDto): Promise<AuthResponse> {
    const storedToken =
      await this.tokenService.getValidatedRefreshToken(refreshToken);
    const user = await this.getUserByIdOrThrow(storedToken.userId);

    await this.tokenService.revokeToken(storedToken);
    return this.buildAuthResponse(user);
  }

  async logout({ refreshToken }: RefreshTokenDto) {
    const storedToken = await this.tokenService.getRefreshToken(refreshToken);

    if (storedToken) {
      await this.tokenService.revokeToken(storedToken);
    }

    return { success: true };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<AuthResponse> {
    const user = await this.getUserByIdOrThrow(userId);

    const isValid = await comparePassword(dto.currentPassword, user.password);

    if (!isValid) {
      throw new UnauthorizedException(
        AUTH_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD,
      );
    }

    user.password = await hashPassword(
      dto.newPassword,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );
    await this.usersRepository.save(user);
    await this.tokenService.revokeAllUserTokens(user.id);

    return this.buildAuthResponse(user);
  }

  async getProfileById(userId: string): Promise<AuthUserProfile> {
    const user = await this.getUserByIdOrThrow(userId);
    return this.buildUserProfile(user);
  }

  private async getUserByIdOrThrow(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const profile = this.buildUserProfile(user);
    const tokens = await this.tokenService.generateTokens(user);

    return {
      ...tokens,
      user: profile,
    };
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
