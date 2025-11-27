import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { User } from '../entities/user.entity';
import { AUTH_ERROR_MESSAGES } from '../auth.constants';

import type { AuthUserProfile } from '../interfaces/auth.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * 프로필 조회
   * @description 사용자 ID로 프로필 정보 반환
   */
  async getProfileById(userId: string): Promise<AuthUserProfile> {
    // 사용자 조회
    const user = await this.getUserByIdOrThrow(userId);

    // 프로필 반환
    return this.buildUserProfile(user);
  }

  /**
   * 사용자 조회
   * @description ID로 사용자 조회, 없으면 예외 발생
   */
  async getUserByIdOrThrow(userId: string): Promise<User> {
    // 사용자 조회
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // 사용자 없음
    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * 사용자 프로필 생성
   * @description User 엔티티를 AuthUserProfile로 변환
   */
  buildUserProfile(user: User): AuthUserProfile {
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
