import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ERROR_CODES } from '../constants/error/error-codes';
import type { ErrorCode } from '../constants/error/error-codes';
import { POST_ERROR_MESSAGES } from '../constants/message/post.messages';
import { Post } from '../posts/entities/post.entity';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async getCommentsByPostId(postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
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
      where: { postId },
      order: { createdAt: 'ASC' },
      relations: { author: true },
    });

    return comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      depth: comment.depth,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
      author: comment.author ? { id: comment.author.id, name: comment.author.name } : null,
    }));
  }
}
