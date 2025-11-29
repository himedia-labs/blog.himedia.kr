import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { TokenService } from './token.service';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { comparePassword, hashPassword } from '../utils/bcrypt.util';
import { AUTH_CONFIG } from '../../constants/config/auth.config';
import { AUTH_ERROR_MESSAGES } from '../../constants/message/auth.messages';

import type { AuthResponse } from '../interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * 로그인
   * @description 검증된 사용자에 대해 토큰 생성 및 프로필 반환
   */
  async login(user: User, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // 토큰 생성 및 프로필과 함께 반환
    return this.tokenService.buildAuthResponseForUser(user, userAgent, ipAddress);
  }

  /**
   * 회원가입
   * @description 이메일/전화번호 중복 확인 후 비밀번호 해싱하여 사용자 생성
   */
  async register(registerDto: RegisterDto, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // 이메일 중복 확인
    const existingEmail = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // 전화번호 중복 확인
    const existingPhone = await this.usersRepository.findOne({
      where: { phone: registerDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException(AUTH_ERROR_MESSAGES.PHONE_ALREADY_EXISTS);
    }

    // 비밀번호 해싱
    const password = await hashPassword(registerDto.password, AUTH_CONFIG.BCRYPT_ROUNDS);

    // 사용자 엔티티 생성
    const userEntity = this.usersRepository.create({
      ...registerDto,
      password,
    });

    // DB 저장
    const savedUser = await this.usersRepository.save(userEntity);

    // 토큰 및 프로필 반환
    return this.tokenService.buildAuthResponseForUser(savedUser, userAgent, ipAddress);
  }

  /**
   * 사용자 인증
   * @description 이메일로 사용자 조회 후 비밀번호 검증 및 승인 상태 확인
   */
  async validateUser(email: string, password: string) {
    // 사용자 조회
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // 사용자 없음
    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // 승인 상태 확인
    if (!user.approved) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.PENDING_APPROVAL);
    }

    // 비밀번호 검증
    const isMatch = await comparePassword(password, user.password);

    // 비밀번호 불일치
    if (!isMatch) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }
}
