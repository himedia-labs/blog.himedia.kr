import { In, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { SnowflakeService } from '@/common/services/snowflake.service';

import { CreateCommentDto } from '@/comments/dto/createComment.dto';
import { UpdateCommentDto } from '@/comments/dto/updateComment.dto';

import { Follow } from '@/follows/entities/follow.entity';
import { Comment } from '@/comments/entities/comment.entity';
import { Post, PostStatus } from '@/posts/entities/post.entity';
import { NotificationType } from '@/notifications/entities/notification.entity';
import { CommentReaction, CommentReactionType } from '@/comments/entities/commentReaction.entity';

import { POST_ERROR_MESSAGES } from '@/constants/message/post.messages';
import { COMMENT_ERROR_MESSAGES, COMMENT_VALIDATION_MESSAGES } from '@/constants/message/comment.messages';

import { NotificationsService } from '@/notifications/notifications.service';

import { sanitizeCommentContent } from '@/comments/utils/comment-content.util';

import { ERROR_CODES } from '@/constants/error/error-codes';
import type { ErrorCode } from '@/constants/error/error-codes';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(CommentReaction)
    private readonly commentReactionsRepository: Repository<CommentReaction>,
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly snowflakeService: SnowflakeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 댓글 목록 조회
   * @description 게시글 댓글과 반응 정보를 반환
   */
  async getCommentsByPostId(postId: string, userId: string | null = null) {
    // 존재/상태 확인
    await this.findPublishedPostOrThrow(postId, { id: true });

    // 기본 목록
    const comments = await this.commentsRepository.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
      relations: { author: true },
    });

    // 유저 좋아요
    let userReactions: CommentReaction[] = [];
    if (userId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      userReactions = await this.commentReactionsRepository.find({
        where: { commentId: In(commentIds), userId, type: CommentReactionType.LIKE },
      });
    }

    // 반응/팔로우 매핑
    const authorIds = this.getAuthorIds(comments);
    const reactionMap = new Map(userReactions.map(reaction => [reaction.commentId, reaction]));
    const { followerCountMap, followingMap } = await this.getFollowInfo(authorIds, userId);

    // 응답 매핑
    return comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      depth: comment.depth,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      liked: reactionMap.has(comment.id),
      isOwner: userId ? comment.authorId === userId : false,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author
        ? {
            id: comment.author.id,
            name: comment.author.name,
            role: comment.author.role,
            profileImageUrl: comment.author.profileImageUrl ?? null,
            followerCount: followerCountMap.get(comment.author.id) ?? 0,
            isFollowing: followingMap.get(comment.author.id) ?? false,
          }
        : null,
    }));
  }

  /**
   * 내 댓글 조회
   * @description 작성한 댓글과 게시글 정보를 반환
   */
  async getCommentsByAuthorId(userId: string) {
    // 내 댓글 목록
    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .where('comment.authorId = :userId', { userId })
      .andWhere('comment.deletedAt IS NULL')
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    // 답글 수
    const commentIds = comments.map(comment => comment.id);
    const replyCountMap = await this.getReplyCountMap(commentIds);

    // 응답 매핑
    return comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      likeCount: comment.likeCount,
      replyCount: replyCountMap.get(comment.id) ?? 0,
      parentId: comment.parentId,
      post: comment.post
        ? {
            id: comment.post.id,
            title: comment.post.title,
            thumbnailUrl: comment.post.thumbnailUrl ?? null,
          }
        : null,
    }));
  }

  /**
   * 댓글 생성
   * @description 게시글에 댓글을 등록
   */
  async createComment(postId: string, body: CreateCommentDto, authorId: string) {
    // 내용 검증
    const content = this.ensureContent(body.content);

    // 존재/상태 확인
    const post = await this.findPublishedPostOrThrow(postId, { id: true, authorId: true });

    // 부모 댓글 확인
    let depth = 0;
    let parentId: string | null = null;
    let parentAuthorId: string | null = null;

    if (body.parentId) {
      const parent = await this.findCommentOrThrow(postId, body.parentId);

      parentId = parent.id;
      depth = parent.depth + 1;
      parentAuthorId = parent.authorId;
    }

    // 저장
    const comment = this.commentsRepository.create({
      id: this.snowflakeService.generate(),
      postId,
      authorId,
      content,
      parentId,
      depth,
    });

    await this.commentsRepository.save(comment);

    // 부모 댓글
    if (parentAuthorId) {
      await this.notificationsService.createNotification({
        actorUserId: authorId,
        targetUserId: parentAuthorId,
        type: NotificationType.COMMENT_REPLY,
        postId: post.id,
        commentId: comment.id,
      });
    }

    // 게시글 작성자
    if (post.authorId && post.authorId !== parentAuthorId) {
      await this.notificationsService.createNotification({
        actorUserId: authorId,
        targetUserId: post.authorId,
        type: NotificationType.POST_COMMENT,
        postId: post.id,
        commentId: comment.id,
      });
    }

    return { id: comment.id };
  }

  /**
   * 댓글 수정
   * @description 댓글 내용을 변경
   */
  async updateComment(postId: string, commentId: string, body: UpdateCommentDto, userId: string) {
    // 내용 검증
    const content = this.ensureContent(body.content);

    // 존재/권한 확인
    const comment = await this.findCommentOrThrow(postId, commentId);
    this.assertOwner(comment.authorId, userId);

    // 수정
    comment.content = content;
    await this.commentsRepository.save(comment);

    return { id: comment.id };
  }

  /**
   * 댓글 삭제
   * @description 댓글을 소프트 삭제
   */
  async deleteComment(postId: string, commentId: string, userId: string) {
    // 존재/권한 확인
    const comment = await this.findCommentOrThrow(postId, commentId);
    this.assertOwner(comment.authorId, userId);

    // 소프트 삭제
    comment.deletedAt = new Date();
    await this.commentsRepository.save(comment);

    return { id: comment.id };
  }

  /**
   * 댓글 좋아요 토글
   * @description 좋아요를 등록/해제하고 수치를 반환
   */
  async toggleCommentLike(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<{ likeCount: number; liked: boolean }> {
    // 사용자 ID 정리
    const safeUserId = userId.trim();

    return this.commentsRepository.manager.transaction(async manager => {
      // 트랜잭션 저장소
      const commentRepository = manager.getRepository(Comment);
      const reactionRepository = manager.getRepository(CommentReaction);

      // 존재 확인
      const comment = await commentRepository.findOne({
        where: { id: commentId, postId, deletedAt: IsNull() },
        select: { id: true, likeCount: true, authorId: true, postId: true },
      });

      if (!comment) {
        const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
          code,
        });
      }

      // 토글 처리
      const existing = await reactionRepository.findOne({
        where: { commentId, userId: safeUserId, type: CommentReactionType.LIKE },
      });

      let liked = false;
      if (existing) {
        await reactionRepository.delete({ commentId, userId: safeUserId, type: CommentReactionType.LIKE });
        await commentRepository.decrement({ id: commentId }, 'likeCount', 1);
      } else {
        const reaction = reactionRepository.create({ commentId, userId: safeUserId, type: CommentReactionType.LIKE });
        await reactionRepository.save(reaction);
        await commentRepository.increment({ id: commentId }, 'likeCount', 1);
        liked = true;
      }

      // 댓글 좋아요
      if (liked && comment.authorId) {
        await this.notificationsService.createNotification({
          actorUserId: safeUserId,
          targetUserId: comment.authorId,
          type: NotificationType.COMMENT_LIKE,
          postId: comment.postId,
          commentId: comment.id,
        });
      }

      // 최신 수치
      const updated = await commentRepository.findOne({
        where: { id: commentId },
        select: { id: true, likeCount: true },
      });

      return {
        likeCount: updated?.likeCount ?? comment.likeCount,
        liked,
      };
    });
  }

  /**
   * 게시글 검증
   * @description 게시글 존재/상태를 확인
   */
  private async findPublishedPostOrThrow(postId: string, select?: { id?: true; authorId?: true }): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id: postId, status: PostStatus.PUBLISHED },
      select,
    });

    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: POST_ERROR_MESSAGES.POST_NOT_FOUND, code });
    }

    return post;
  }

  /**
   * 댓글 검증
   * @description 댓글 존재 여부를 확인
   */
  private async findCommentOrThrow(postId: string, commentId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, postId, deletedAt: IsNull() },
    });

    if (!comment) {
      const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND, code });
    }

    return comment;
  }

  /**
   * 권한 검증
   * @description 댓글 작성자 권한을 확인
   */
  private assertOwner(authorId: string | null, userId: string) {
    if (authorId === userId) {
      return;
    }

    const code = ERROR_CODES.COMMENT_FORBIDDEN as ErrorCode;
    throw new ForbiddenException({ message: COMMENT_ERROR_MESSAGES.COMMENT_FORBIDDEN, code });
  }

  /**
   * 내용 검증
   * @description 댓글 내용을 검증하고 반환
   */
  private ensureContent(content?: string) {
    const trimmed = sanitizeCommentContent(content ?? '');
    if (trimmed) {
      return trimmed;
    }

    const code = ERROR_CODES.VALIDATION_FAILED as ErrorCode;
    throw new BadRequestException({ message: COMMENT_VALIDATION_MESSAGES.CONTENT_REQUIRED, code });
  }

  /**
   * 작성자 목록
   * @description 댓글 작성자 ID를 추출
   */
  private getAuthorIds(comments: Comment[]) {
    const authorIds = comments.map(comment => comment.authorId).filter((id): id is string => Boolean(id));
    return Array.from(new Set(authorIds));
  }

  /**
   * 팔로우 정보
   * @description 팔로워 수와 팔로잉 상태를 조회
   */
  private async getFollowInfo(authorIds: string[], userId: string | null) {
    const followingMap = new Map<string, boolean>();
    const followerCountMap = new Map<string, number>();

    if (authorIds.length > 0) {
      const followerCounts = await this.followsRepository
        .createQueryBuilder('follow')
        .select('follow.followingId', 'followingId')
        .addSelect('COUNT(*)', 'count')
        .where('follow.followingId IN (:...authorIds)', { authorIds })
        .groupBy('follow.followingId')
        .getRawMany<{ followingId: string; count: string }>();

      followerCounts.forEach(row => {
        followerCountMap.set(row.followingId, Number(row.count));
      });
    }

    if (userId && authorIds.length > 0) {
      const followings = await this.followsRepository.find({
        where: { followerId: userId, followingId: In(authorIds) },
      });

      followings.forEach(follow => {
        followingMap.set(follow.followingId, true);
      });
    }

    return { followerCountMap, followingMap };
  }

  /**
   * 답글 수
   * @description 댓글별 답글 수를 계산
   */
  private async getReplyCountMap(commentIds: string[]) {
    const replyCountMap = new Map<string, number>();

    if (commentIds.length === 0) {
      return replyCountMap;
    }

    const replyCounts = await this.commentsRepository
      .createQueryBuilder('reply')
      .select('reply.parentId', 'parentId')
      .addSelect('COUNT(*)', 'count')
      .where('reply.parentId IN (:...commentIds)', { commentIds })
      .andWhere('reply.deletedAt IS NULL')
      .groupBy('reply.parentId')
      .getRawMany<{ parentId: string; count: string }>();

    replyCounts.forEach(row => {
      replyCountMap.set(row.parentId, Number(row.count));
    });

    return replyCountMap;
  }
}
