import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { User } from '@/auth/entities/user.entity';
import { ERROR_CODES } from '@/constants/error/error-codes';
import { formatPhoneNumber, normalizePhoneNumber } from '@/auth/utils/phone.util';
import { AUTH_ERROR_MESSAGES, AUTH_VALIDATION_MESSAGES } from '@/constants/message/auth.messages';

import type { AuthUserProfile, PublicUserProfile } from '@/auth/interfaces/user.interface';

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
      birthDate: user.birthDate ?? null,
      profileHandle: user.profileHandle ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      profileBio: user.profileBio ?? null,
      profileContactEmail: user.profileContactEmail ?? null,
      profileGithubUrl: user.profileGithubUrl ?? null,
      profileLinkedinUrl: user.profileLinkedinUrl ?? null,
      profileTwitterUrl: user.profileTwitterUrl ?? null,
      profileFacebookUrl: user.profileFacebookUrl ?? null,
      profileWebsiteUrl: user.profileWebsiteUrl ?? null,
    };
  }

  /**
   * 공개 프로필 조회
   * @description 프로필 핸들로 공개 프로필 정보 반환
   */
  async getPublicProfileByHandle(profileHandle: string): Promise<PublicUserProfile> {
    const normalized = profileHandle.trim();
    const user = await this.usersRepository.findOne({
      where: [{ profileHandle: ILike(normalized) }, { email: ILike(`${normalized}@%`) }],
      select: [
        'id',
        'name',
        'profileHandle',
        'profileImageUrl',
        'profileBio',
        'profileContactEmail',
        'profileGithubUrl',
        'profileLinkedinUrl',
        'profileTwitterUrl',
        'profileFacebookUrl',
        'profileWebsiteUrl',
      ],
    });

    if (!user) {
      throw new NotFoundException({
        message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      });
    }

    return {
      id: user.id,
      name: user.name,
      profileHandle: user.profileHandle ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      profileBio: user.profileBio ?? null,
      profileContactEmail: user.profileContactEmail ?? null,
      profileGithubUrl: user.profileGithubUrl ?? null,
      profileLinkedinUrl: user.profileLinkedinUrl ?? null,
      profileTwitterUrl: user.profileTwitterUrl ?? null,
      profileFacebookUrl: user.profileFacebookUrl ?? null,
      profileWebsiteUrl: user.profileWebsiteUrl ?? null,
    };
  }

  // --------------------------- 프로필 수정 ---------------------------

  /**
   * 프로필 이미지 수정
   * @description 프로필 이미지 URL을 업데이트
   */
  async updateProfileImage(userId: string, profileImageUrl?: string | null): Promise<AuthUserProfile> {
    const user = await this.getUserByIdOrThrow(userId);
    if (typeof profileImageUrl === 'undefined') {
      return this.buildUserProfile(user);
    }

    const trimmed = profileImageUrl?.trim() ?? '';
    user.profileImageUrl = trimmed ? trimmed : null;
    await this.usersRepository.save(user);

    return this.buildUserProfile(user);
  }

  /**
   * 프로필 수정
   * @description 이름/프로필 아이디/소셜 링크를 업데이트
   */
  async updateProfile(
    userId: string,
    name?: string | null,
    profileHandle?: string | null,
    profileContactEmail?: string | null,
    profileGithubUrl?: string | null,
    profileLinkedinUrl?: string | null,
    profileTwitterUrl?: string | null,
    profileFacebookUrl?: string | null,
    profileWebsiteUrl?: string | null,
  ): Promise<AuthUserProfile> {
    const user = await this.getUserByIdOrThrow(userId);
    const nextName = name?.trim();
    const nextHandleRaw = profileHandle?.trim();
    const nextHandle = nextHandleRaw?.startsWith('@') ? nextHandleRaw.slice(1) : nextHandleRaw;
    const nextProfileContactEmail = profileContactEmail?.trim().toLowerCase() ?? '';

    if (typeof name !== 'undefined') {
      if (!nextName) {
        throw new ConflictException({
          message: AUTH_VALIDATION_MESSAGES.NAME_STRING,
          code: ERROR_CODES.VALIDATION_FAILED,
        });
      }
      user.name = nextName;
    }

    if (typeof profileHandle !== 'undefined') {
      if (!nextHandle) {
        throw new ConflictException({
          message: AUTH_VALIDATION_MESSAGES.PROFILE_HANDLE_REQUIRED,
          code: ERROR_CODES.VALIDATION_FAILED,
        });
      }
      const normalized = nextHandle.toLowerCase();
      if (normalized !== user.profileHandle) {
        const isDuplicated = await this.usersRepository.exist({ where: { profileHandle: normalized } });
        if (isDuplicated) {
          throw new ConflictException({
            message: AUTH_VALIDATION_MESSAGES.PROFILE_HANDLE_DUPLICATE,
            code: ERROR_CODES.AUTH_PROFILE_HANDLE_ALREADY_EXISTS,
          });
        }
        user.profileHandle = normalized;
      }
    }

    if (typeof profileContactEmail !== 'undefined') {
      user.profileContactEmail = nextProfileContactEmail || null;
    }

    if (typeof profileGithubUrl !== 'undefined') {
      user.profileGithubUrl = this.normalizeProfileUrl(profileGithubUrl);
    }

    if (typeof profileLinkedinUrl !== 'undefined') {
      user.profileLinkedinUrl = this.normalizeProfileUrl(profileLinkedinUrl);
    }

    if (typeof profileTwitterUrl !== 'undefined') {
      user.profileTwitterUrl = this.normalizeProfileUrl(profileTwitterUrl);
    }

    if (typeof profileFacebookUrl !== 'undefined') {
      user.profileFacebookUrl = this.normalizeProfileUrl(profileFacebookUrl);
    }

    if (typeof profileWebsiteUrl !== 'undefined') {
      user.profileWebsiteUrl = this.normalizeProfileUrl(profileWebsiteUrl);
    }

    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  /**
   * 프로필 URL 정규화
   * @description 공백 제거 후 비어있으면 null 반환
   */
  private normalizeProfileUrl(value?: string | null): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed : null;
  }

  /**
   * 계정 기본 정보 수정
   * @description 이메일/전화번호/생년월일을 업데이트
   */
  async updateAccountInfo(
    userId: string,
    email?: string | null,
    phone?: string | null,
    birthDate?: string | null,
  ): Promise<AuthUserProfile> {
    // 사용자 조회
    const user = await this.getUserByIdOrThrow(userId);

    // 이메일 수정
    if (typeof email !== 'undefined') {
      const nextEmail = (email ?? '').trim().toLowerCase();
      if (nextEmail && nextEmail !== user.email) {
        const emailExists = await this.usersRepository.exist({ where: { email: nextEmail } });
        if (emailExists) {
          throw new ConflictException({
            message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
            code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
          });
        }
        user.email = nextEmail;
      }
    }

    // 전화번호 수정
    if (typeof phone !== 'undefined') {
      const nextPhone = (phone ?? '').trim();
      const normalizedPhone = normalizePhoneNumber(nextPhone);
      const formattedPhone = formatPhoneNumber(normalizedPhone);

      if (formattedPhone && formattedPhone !== user.phone) {
        const phoneExists = await this.usersRepository.exist({
          where: [{ phone: normalizedPhone }, { phone: formattedPhone }],
        });
        if (phoneExists) {
          throw new ConflictException({
            message: AUTH_ERROR_MESSAGES.PHONE_ALREADY_EXISTS,
            code: ERROR_CODES.AUTH_PHONE_ALREADY_EXISTS,
          });
        }
        user.phone = formattedPhone;
      }
    }

    // 생년월일 수정
    if (typeof birthDate !== 'undefined') {
      const nextBirthDate = (birthDate ?? '').trim();
      user.birthDate = nextBirthDate || null;
    }

    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  /**
   * 자기소개 수정
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
