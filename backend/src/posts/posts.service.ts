import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Post, PostStatus } from './entities/post.entity';
import { Tag } from './entities/tag.entity';
import { PostTag } from './entities/postTag.entity';
import { PostImage, PostImageType } from './entities/postImage.entity';
import { ERROR_CODES } from '../constants/error/error-codes';
import type { ErrorCode } from '../constants/error/error-codes';
import { POST_ERROR_MESSAGES, POST_VALIDATION_MESSAGES } from '../constants/message/post.messages';
import { ListPostsQueryDto, PostSortOption, SortOrder } from './dto/listPostsQuery.dto';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { SnowflakeService } from '../common/services/snowflake.service';

const ensurePublishFields = (fields: { title?: string | null; content?: string | null; categoryId?: string | null }) => {
  const code = ERROR_CODES.VALIDATION_FAILED as ErrorCode;

  if (!fields.title?.trim()) {
    throw new BadRequestException({ message: POST_VALIDATION_MESSAGES.TITLE_REQUIRED, code });
  }
  if (!fields.content?.trim()) {
    throw new BadRequestException({ message: POST_VALIDATION_MESSAGES.CONTENT_REQUIRED, code });
  }
  if (!fields.categoryId) {
    throw new BadRequestException({ message: POST_VALIDATION_MESSAGES.CATEGORY_REQUIRED, code });
  }
};

const IMAGE_URL_MAX_LENGTH = 500;

const extractImageUrls = (content: string) => {
  const urls = new Set<string>();
  const addUrl = (value?: string) => {
    const url = value?.trim();
    if (url && url.length <= IMAGE_URL_MAX_LENGTH) {
      urls.add(url);
    }
  };

  const markdownImageRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    addUrl(match[1]);
  }

  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    addUrl(match[1]);
  }

  return Array.from(urls);
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  private buildPostImages(post: Post, postImageRepository: Repository<PostImage>) {
    const images: PostImage[] = [];
    const contentUrls = extractImageUrls(post.content ?? '');
    const thumbnailUrl = post.thumbnailUrl?.trim();
    const usedUrls = new Set<string>();

    if (thumbnailUrl) {
      usedUrls.add(thumbnailUrl);
      images.push(
        postImageRepository.create({
          id: this.snowflakeService.generate(),
          postId: post.id,
          url: thumbnailUrl,
          type: PostImageType.THUMBNAIL,
        }),
      );
    }

    contentUrls.forEach(url => {
      if (usedUrls.has(url)) return;
      usedUrls.add(url);
      images.push(
        postImageRepository.create({
          id: this.snowflakeService.generate(),
          postId: post.id,
          url,
          type: PostImageType.CONTENT,
        }),
      );
    });

    return images;
  }

  async getPosts(query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sort = query.sort ?? PostSortOption.CREATED_AT;
    const order = query.order ?? SortOrder.DESC;

    const status = query.status ?? PostStatus.PUBLISHED;
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.commentCount', 'post.comments', 'comment', qb =>
        qb.andWhere('comment.deletedAt IS NULL'),
      )
      .where('post.status = :status', { status });

    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    const [posts, total] = await queryBuilder
      .orderBy(`post.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        status: post.status,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        shareCount: post.shareCount,
        commentCount: post.commentCount ?? 0,
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

  // 임시저장 목록 조회
  async getDrafts(query: ListPostsQueryDto, authorId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sort = query.sort ?? PostSortOption.CREATED_AT;
    const order = query.order ?? SortOrder.DESC;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.status = :status', { status: PostStatus.DRAFT })
      .andWhere('post.authorId = :authorId', { authorId });

    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    const [posts, total] = await queryBuilder
      .orderBy(`post.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        status: post.status,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        shareCount: post.shareCount,
        commentCount: 0,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        category: post.category ? { id: post.category.id, name: post.category.name } : null,
        author: null,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 임시저장 상세 조회
  async getDraft(postId: string, authorId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId, status: PostStatus.DRAFT, authorId },
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
      thumbnailUrl: post.thumbnailUrl,
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      category: post.category ? { id: post.category.id, name: post.category.name } : null,
      author: post.author ? { id: post.author.id, name: post.author.name } : null,
      tags: post.postTags?.map(postTag => ({ id: postTag.tag.id, name: postTag.tag.name })) ?? [],
    };
  }

  // 게시글 생성
  async createPost(payload: CreatePostDto, authorId: string) {
    const status = payload.status ?? PostStatus.DRAFT;
    if (status === PostStatus.PUBLISHED) {
      ensurePublishFields({
        title: payload.title,
        content: payload.content,
        categoryId: payload.categoryId,
      });
    }
    const rawTags = payload.tags ?? [];
    const normalizedTags = rawTags
      .map(tag => tag.trim().replace(/^#+/, ''))
      .filter(Boolean);

    return this.postsRepository.manager.transaction(async manager => {
      const postRepository = manager.getRepository(Post);
      const tagRepository = manager.getRepository(Tag);
      const postTagRepository = manager.getRepository(PostTag);
      const postImageRepository = manager.getRepository(PostImage);

      const post = postRepository.create({
        id: this.snowflakeService.generate(),
        authorId,
        categoryId: payload.categoryId ?? null,
        title: payload.title,
        content: payload.content,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
      });

      const savedPost = await postRepository.save(post);

      if (normalizedTags.length) {
        const existingTags = await tagRepository.find({
          where: { name: In(normalizedTags) },
        });
        const tagMap = new Map(existingTags.map(tag => [tag.name, tag]));

        for (const name of normalizedTags) {
          if (tagMap.has(name)) continue;
          const newTag = tagRepository.create({
            id: this.snowflakeService.generate(),
            name,
          });

          try {
            const savedTag = await tagRepository.save(newTag);
            tagMap.set(name, savedTag);
          } catch (error) {
            if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
              const fallbackTag = await tagRepository.findOne({ where: { name } });
              if (fallbackTag) {
                tagMap.set(name, fallbackTag);
                continue;
              }
            }
            throw error;
          }
        }

        const postTags = Array.from(tagMap.values()).map(tag =>
          postTagRepository.create({
            postId: savedPost.id,
            tagId: tag.id,
          }),
        );

        if (postTags.length) {
          await postTagRepository.save(postTags);
        }
      }

      await postImageRepository.delete({ postId: savedPost.id });
      const postImages = this.buildPostImages(savedPost, postImageRepository);
      if (postImages.length) {
        await postImageRepository.save(postImages);
      }

      return { id: savedPost.id };
    });
  }

  // 게시글 수정
  async updatePost(postId: string, payload: UpdatePostDto, authorId: string) {
    return this.postsRepository.manager.transaction(async manager => {
      const postRepository = manager.getRepository(Post);
      const tagRepository = manager.getRepository(Tag);
      const postTagRepository = manager.getRepository(PostTag);
      const postImageRepository = manager.getRepository(PostImage);

      const post = await postRepository.findOne({
        where: { id: postId, authorId },
        relations: {
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

      const nextStatus = payload.status ?? post.status;
      const nextTitle = payload.title ?? post.title;
      const nextContent = payload.content ?? post.content;
      const nextCategoryId = payload.categoryId !== undefined ? payload.categoryId : post.categoryId;
      if (nextStatus === PostStatus.PUBLISHED) {
        ensurePublishFields({
          title: nextTitle,
          content: nextContent,
          categoryId: nextCategoryId,
        });
      }

      if (payload.title !== undefined) post.title = payload.title;
      if (payload.content !== undefined) post.content = payload.content;
      if (payload.categoryId !== undefined) post.categoryId = payload.categoryId;
      if (payload.thumbnailUrl !== undefined) {
        post.thumbnailUrl = payload.thumbnailUrl.trim() ? payload.thumbnailUrl : null;
      }
      if (payload.status !== undefined) {
        post.status = payload.status;
        if (payload.status === PostStatus.PUBLISHED && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }

      const savedPost = await postRepository.save(post);

      if (payload.tags !== undefined) {
        await postTagRepository.delete({ postId: savedPost.id });

        const normalizedTags = payload.tags
          .map(tag => tag.trim().replace(/^#+/, ''))
          .filter(Boolean);

        if (normalizedTags.length) {
          const existingTags = await tagRepository.find({
            where: { name: In(normalizedTags) },
          });
          const tagMap = new Map(existingTags.map(tag => [tag.name, tag]));

          for (const name of normalizedTags) {
            if (tagMap.has(name)) continue;
            const newTag = tagRepository.create({
              id: this.snowflakeService.generate(),
              name,
            });

            try {
              const savedTag = await tagRepository.save(newTag);
              tagMap.set(name, savedTag);
            } catch (error) {
              if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
                const fallbackTag = await tagRepository.findOne({ where: { name } });
                if (fallbackTag) {
                  tagMap.set(name, fallbackTag);
                  continue;
                }
              }
              throw error;
            }
          }

          const postTags = Array.from(tagMap.values()).map(tag =>
            postTagRepository.create({
              postId: savedPost.id,
              tagId: tag.id,
            }),
          );

          if (postTags.length) {
            await postTagRepository.save(postTags);
          }
        }
      }

      await postImageRepository.delete({ postId: savedPost.id });
      const postImages = this.buildPostImages(savedPost, postImageRepository);
      if (postImages.length) {
        await postImageRepository.save(postImages);
      }

      return { id: savedPost.id };
    });
  }

  async getPostDetail(postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId, status: PostStatus.PUBLISHED },
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
      thumbnailUrl: post.thumbnailUrl,
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      category: post.category ? { id: post.category.id, name: post.category.name } : null,
      author: post.author ? { id: post.author.id, name: post.author.name } : null,
      tags: post.postTags?.map(postTag => ({ id: postTag.tag.id, name: postTag.tag.name })) ?? [],
    };
  }

  // 공유 카운트 증가
  async incrementShareCount(postId: string) {
    const result = await this.postsRepository.increment({ id: postId, status: PostStatus.PUBLISHED }, 'shareCount', 1);

    if (!result.affected) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    const post = await this.postsRepository.findOne({
      where: { id: postId },
      select: { id: true, shareCount: true },
    });

    return {
      shareCount: post?.shareCount ?? 0,
    };
  }
}
