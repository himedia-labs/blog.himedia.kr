import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { ERROR_CODES } from '../constants/error/error-codes';
import type { ErrorCode } from '../constants/error/error-codes';
import { COMMENT_ERROR_MESSAGES, COMMENT_VALIDATION_MESSAGES } from '../constants/message/comment.messages';
import { POST_ERROR_MESSAGES } from '../constants/message/post.messages';
import { SnowflakeService } from '../common/services/snowflake.service';
import { Post, PostStatus } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { Comment } from './entities/comment.entity';
import { CommentReaction, CommentReactionType } from './entities/commentReaction.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(CommentReaction)
    private readonly commentReactionsRepository: Repository<CommentReaction>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  async getCommentsByPostId(postId: string, userId: string | null = null) {
    const post = await this.postsRepository.findOne({
      where: { id: postId, status: PostStatus.PUBLISHED },
      select: { id: true },
    });

    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    const comments = await this.commentsRepository.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
      relations: { author: true },
    });

    let userReactions: CommentReaction[] = [];
    if (userId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      userReactions = await this.commentReactionsRepository.find({
        where: { commentId: In(commentIds), userId, type: CommentReactionType.LIKE },
      });
    }

    const reactionMap = new Map(userReactions.map(r => [r.commentId, r]));

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
        ? { id: comment.author.id, name: comment.author.name, role: comment.author.role }
        : null,
    }));
  }

  async createComment(postId: string, body: CreateCommentDto, authorId: string) {
    const content = body.content?.trim();
    if (!content) {
      const code = ERROR_CODES.VALIDATION_FAILED as ErrorCode;
      throw new BadRequestException({ message: COMMENT_VALIDATION_MESSAGES.CONTENT_REQUIRED, code });
    }

    const post = await this.postsRepository.findOne({
      where: { id: postId, status: PostStatus.PUBLISHED },
      select: { id: true },
    });

    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    let parentId: string | null = null;
    let depth = 0;

    if (body.parentId) {
      const parent = await this.commentsRepository.findOne({
        where: { id: body.parentId, postId, deletedAt: IsNull() },
      });

      if (!parent) {
        const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
          code,
        });
      }

      parentId = parent.id;
      depth = parent.depth + 1;
    }

    const comment = this.commentsRepository.create({
      id: this.snowflakeService.generate(),
      postId,
      authorId,
      content,
      parentId,
      depth,
    });

    await this.commentsRepository.save(comment);

    return { id: comment.id };
  }

  async updateComment(postId: string, commentId: string, body: UpdateCommentDto, userId: string) {
    const content = body.content?.trim();
    if (!content) {
      const code = ERROR_CODES.VALIDATION_FAILED as ErrorCode;
      throw new BadRequestException({ message: COMMENT_VALIDATION_MESSAGES.CONTENT_REQUIRED, code });
    }

    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, postId, deletedAt: IsNull() },
    });

    if (!comment) {
      const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND, code });
    }

    if (comment.authorId !== userId) {
      const code = ERROR_CODES.COMMENT_FORBIDDEN as ErrorCode;
      throw new ForbiddenException({ message: COMMENT_ERROR_MESSAGES.COMMENT_FORBIDDEN, code });
    }

    comment.content = content;
    await this.commentsRepository.save(comment);

    return { id: comment.id };
  }

  async deleteComment(postId: string, commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, postId, deletedAt: IsNull() },
    });

    if (!comment) {
      const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
      throw new NotFoundException({ message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND, code });
    }

    if (comment.authorId !== userId) {
      const code = ERROR_CODES.COMMENT_FORBIDDEN as ErrorCode;
      throw new ForbiddenException({ message: COMMENT_ERROR_MESSAGES.COMMENT_FORBIDDEN, code });
    }

    comment.deletedAt = new Date();
    await this.commentsRepository.save(comment);

    return { id: comment.id };
  }

  async toggleCommentLike(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<{ likeCount: number; liked: boolean }> {
    const safeUserId = userId.trim();
    return this.commentsRepository.manager.transaction(async manager => {
      const commentRepository = manager.getRepository(Comment);
      const reactionRepository = manager.getRepository(CommentReaction);

      const comment = await commentRepository.findOne({
        where: { id: commentId, postId, deletedAt: IsNull() },
        select: { id: true, likeCount: true },
      });

      if (!comment) {
        const code = ERROR_CODES.COMMENT_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
          code,
        });
      }

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
}
