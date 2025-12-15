import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { TokenService } from './token.service';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { ERROR_CODES } from '../../constants/error/error-codes';
import { SnowflakeService } from '../../common/services/snowflake.service';
import { comparePassword, hashWithAuthRounds } from '../utils/bcrypt.util';
import { AUTH_ERROR_MESSAGES } from '../../constants/message/auth.messages';

import type { AuthResponse } from '../interfaces/auth.interface';

/**
 * 인증 서비스
 * @description 로그인, 회원가입, 사용자 인증 처리
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 로그인
   * @description 검증된 사용자에 대해 토큰 생성 및 프로필 반환
   */
  async login(user: User, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // 로그인 성공 시 토큰과 프로필 반환
    return this.tokenService.buildAuthResponseForUser(user, userAgent, ipAddress);
  }

  /**
   * 회원가입
   * @description 이메일/전화번호 중복 확인 후 비밀번호 해싱하여 사용자 생성
   */
  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // 이메일 중복 확인
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException({
          message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
          code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        });
      }
      if (existingUser.phone === registerDto.phone) {
        throw new ConflictException({
          message: AUTH_ERROR_MESSAGES.PHONE_ALREADY_EXISTS,
          code: ERROR_CODES.AUTH_PHONE_ALREADY_EXISTS,
        });
      }
    }

    // 비밀번호 해싱
    const password = await hashWithAuthRounds(registerDto.password);

    // Snowflake ID 생성
    const id = this.snowflakeService.generate();

    // 사용자 엔티티 생성
    const userEntity = this.usersRepository.create({
      id,
      ...registerDto,
      password,
    });

    // DB 저장
    try {
      const savedUser = await this.usersRepository.save(userEntity);

      // 토큰 및 프로필 반환
      return this.tokenService.buildAuthResponseForUser(savedUser, userAgent, ipAddress);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
        const detailRaw = (error as { detail?: unknown }).detail;
        const detail = typeof detailRaw === 'string' ? detailRaw : '';
        if (detail.includes('email')) {
          throw new ConflictException({
            message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
            code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
          });
        }
        if (detail.includes('phone')) {
          throw new ConflictException({
            message: AUTH_ERROR_MESSAGES.PHONE_ALREADY_EXISTS,
            code: ERROR_CODES.AUTH_PHONE_ALREADY_EXISTS,
          });
        }
      }

      throw error;
    }
  }

  /**
   * 사용자 인증
   * @description 이메일로 사용자 조회 후 비밀번호 검증 및 승인 상태 확인
   */
  async validateUser(email: string, password: string): Promise<User> {
    // 이메일로 사용자 조회
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // 사용자 없음
    if (!user) {
      throw new UnauthorizedException({
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        code: ERROR_CODES.AUTH_EMAIL_NOT_FOUND,
      });
    }

    // 비밀번호 검증
    const isMatch = await comparePassword(password, user.password);

    // 비밀번호 불일치
    if (!isMatch) {
      throw new UnauthorizedException({
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        code: ERROR_CODES.AUTH_INVALID_CURRENT_PASSWORD,
      });
    }

    // 승인 상태 확인
    if (!user.approved) {
      throw new ForbiddenException({
        message: AUTH_ERROR_MESSAGES.PENDING_APPROVAL,
        code: ERROR_CODES.AUTH_PENDING_APPROVAL,
      });
    }

    return user;
  }
}
