import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';

import { Post, PostStatus } from './entities/post.entity';
import { ERROR_CODES } from '../constants/error/error-codes';
import type { ErrorCode } from '../constants/error/error-codes';
import { POST_ERROR_MESSAGES } from '../constants/message/post.messages';
import { ListPostsQueryDto, PostSortOption, SortOrder } from './dto/listPostsQuery.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async getPosts(query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sort = query.sort ?? PostSortOption.CREATED_AT;
    const order = query.order ?? SortOrder.DESC;

    const where: FindOptionsWhere<Post> = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.status) {
      where.status = query.status;
    } else {
      where.status = PostStatus.PUBLISHED;
    }

    const orderBy = { [sort]: order } as FindOptionsOrder<Post>;

    const [posts, total] = await this.postsRepository.findAndCount({
      where,
      order: orderBy,
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        category: true,
        author: true,
      },
    });

    return {
      items: posts.map(post => ({
        id: post.id,
        title: post.title,
        status: post.status,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        category: post.category ? { id: post.category.id, name: post.category.name } : null,
        author: post.author ? { id: post.author.id, name: post.author.name } : null,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostDetail(postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: {
        category: true,
        author: true,
        postTags: {
          tag: true,
        },
      },
    });

    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      category: post.category ? { id: post.category.id, name: post.category.name } : null,
      author: post.author ? { id: post.author.id, name: post.author.name } : null,
      tags: post.postTags?.map(postTag => ({ id: postTag.tag.id, name: postTag.tag.name })) ?? [],
    };
  }
}
