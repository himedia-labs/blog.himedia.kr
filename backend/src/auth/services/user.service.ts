import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { ERROR_CODES } from '../../constants/error/error-codes';
import { AUTH_ERROR_MESSAGES } from '../../constants/message/auth.messages';

import type { AuthUserProfile } from '../interfaces/user.interface';

/**
 * 사용자 서비스
 * @description 사용자 조회 및 프로필 관리
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // --------------------------- 사용자 조회 (User 엔티티 반환) ---------------------------

  /**
   * 사용자 조회 (PK)
   * @description 인증된 사용자 조회용. 없으면 USER_NOT_FOUND 예외
   */
  async getUserByIdOrThrow(userId: string): Promise<User> {
    // 사용자 조회
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // 사용자 없음
    if (!user) {
      throw new UnauthorizedException({
        message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    return user;
  }

  /**
   * 사용자 조회 (이메일)
   * @description 공개 API용(비밀번호 찾기) 없으면 EMAIL_NOT_FOUND 예외
   */
  async getUserByEmailOrThrow(email: string): Promise<User> {
    // 사용자 조회
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // 사용자 없음
    if (!user) {
      throw new UnauthorizedException({
        message: AUTH_ERROR_MESSAGES.EMAIL_NOT_FOUND,
        code: ERROR_CODES.AUTH_EMAIL_NOT_FOUND,
      });
    }

    return user;
  }

  /**
   * 사용자 존재 여부 조회 (이메일, 예외 없이 확인용)
   * @description Guard에서 체크용. 예외 발생 없이 null 반환
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // --------------------------- 프로필 조회 및 변환 ---------------------------

  /**
   * 프로필 조회
   * @description 사용자 ID(PK)로 프로필 정보 반환
   */
  async getProfileById(userId: string): Promise<AuthUserProfile> {
    // 사용자 조회
    const user = await this.getUserByIdOrThrow(userId);

    // 프로필 반환
    return this.buildUserProfile(user);
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
      profileBio: user.profileBio ?? null,
    };
  }

  // --------------------------- 프로필 수정 ---------------------------

  /**
   * 프로필 수정
   * @description 사용자 자기소개를 업데이트
   */
  async updateProfileBio(userId: string, profileBio?: string | null): Promise<AuthUserProfile> {
    const user = await this.getUserByIdOrThrow(userId);
    if (typeof profileBio === 'undefined') {
      return this.buildUserProfile(user);
    }

    const trimmed = profileBio?.trim() ?? '';
    user.profileBio = trimmed ? trimmed : null;
    await this.usersRepository.save(user);

    return this.buildUserProfile(user);
  }
}
