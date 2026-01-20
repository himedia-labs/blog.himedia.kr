import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { ERROR_CODES } from '../constants/error/error-codes';
import { FOLLOW_ERROR_MESSAGES } from '../constants/message/follow.messages';
import { Follow } from './entities/follow.entity';

import type { ErrorCode } from '../constants/error/error-codes';
@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async followUser(targetUserId: string, userId: string): Promise<{ following: boolean }> {
    // 입력 검증
    const followerId = userId.trim();
    const followingId = targetUserId.trim();

    if (followerId === followingId) {
      const code = ERROR_CODES.FOLLOW_SELF_NOT_ALLOWED as ErrorCode;
      throw new BadRequestException({ message: FOLLOW_ERROR_MESSAGES.SELF_FOLLOW_NOT_ALLOWED, code });
    }

    // 대상 사용자 조회
    const targetUser = await this.usersRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      const code = ERROR_CODES.FOLLOW_USER_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: FOLLOW_ERROR_MESSAGES.USER_NOT_FOUND, code });
    }

    // 팔로우 저장
    const existing = await this.followsRepository.findOne({ where: { followerId, followingId } });
    if (existing) return { following: true };

    const follow = this.followsRepository.create({ followerId, followingId });
    await this.followsRepository.save(follow);

    return { following: true };
  }

  async unfollowUser(targetUserId: string, userId: string): Promise<{ following: boolean }> {
    // 입력 검증
    const followerId = userId.trim();
    const followingId = targetUserId.trim();

    if (followerId === followingId) {
      const code = ERROR_CODES.FOLLOW_SELF_NOT_ALLOWED as ErrorCode;
      throw new BadRequestException({ message: FOLLOW_ERROR_MESSAGES.SELF_FOLLOW_NOT_ALLOWED, code });
    }

    // 팔로우 삭제
    const existing = await this.followsRepository.findOne({ where: { followerId, followingId } });
    if (!existing) return { following: false };

    await this.followsRepository.delete({ followerId, followingId });

    return { following: false };
  }
}
