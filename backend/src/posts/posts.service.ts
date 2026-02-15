import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';

import { SnowflakeService } from '@/common/services/snowflake.service';

import { ERROR_CODES } from '@/constants/error/error-codes';
import { AUTH_ERROR_MESSAGES } from '@/constants/message/auth.messages';
import { POST_ERROR_MESSAGES, POST_VALIDATION_MESSAGES } from '@/constants/message/post.messages';

import { Follow } from '@/follows/entities/follow.entity';
import { Comment } from '@/comments/entities/comment.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/notifications/entities/notification.entity';

import { CreatePostDto } from '@/posts/dto/createPost.dto';
import { UpdatePostDto } from '@/posts/dto/updatePost.dto';
import { ListPostsQueryDto } from '@/posts/dto/listPostsQuery.dto';
import { PostSortOption, SortOrder } from '@/posts/posts.types';
import { IMAGE_URL_MAX_LENGTH, SHARE_WINDOW_MINUTES, VIEW_WINDOW_HOURS } from '@/posts/posts.constants';

import { Tag } from '@/posts/entities/tag.entity';
import { PostTag } from '@/posts/entities/postTag.entity';
import { PostLike } from '@/posts/entities/postLike.entity';
import { Post, PostStatus } from '@/posts/entities/post.entity';
import { PostViewLog } from '@/posts/entities/postViewLog.entity';
import { PostShareLog } from '@/posts/entities/postShareLog.entity';
import { PostImage, PostImageType } from '@/posts/entities/postImage.entity';

import type { ErrorCode } from '@/constants/error/error-codes';

/**
 * 게시글 발행 검증
 * @description 발행 필수 필드를 확인
 */
const ensurePublishFields = (fields: {
  title?: string | null;
  content?: string | null;
  categoryId?: string | null;
}) => {
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

/**
 * 이미지 URL 추출
 * @description 콘텐츠에서 이미지 URL을 추출
 */
const extractImageUrls = (content: string) => {
  const urls = new Set<string>();

  /**
   * URL 추가
   * @description 유효한 URL만 수집
   */
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
  /**
   * 게시글 서비스
   * @description 게시글 도메인 로직을 처리
   */
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    @InjectRepository(PostShareLog)
    private readonly postShareLogRepository: Repository<PostShareLog>,
    @InjectRepository(PostViewLog)
    private readonly postViewLogRepository: Repository<PostViewLog>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly snowflakeService: SnowflakeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 게시글 이미지 구성
   * @description 썸네일과 본문 이미지 목록을 생성
   */
  private buildPostImages(post: Post, postImageRepository: Repository<PostImage>) {
    // 기본/준비
    const images: PostImage[] = [];
    const usedUrls = new Set<string>();

    // URL/추출
    const thumbnailUrl = post.thumbnailUrl?.trim();
    const contentUrls = extractImageUrls(post.content ?? '');

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

  /**
   * 게시글 목록
   * @description 게시글 목록을 조회
   */
  async getPosts(query: ListPostsQueryDto, userId?: string | null) {
    // 페이징/정렬
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const order = query.order ?? SortOrder.DESC;
    const sort = query.sort ?? PostSortOption.CREATED_AT;

    // 필터/상태
    const feed = query.feed ?? null;
    const status = query.status ?? PostStatus.PUBLISHED;

    // 목록/쿼리
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
      .loadRelationCountAndMap('post.commentCount', 'post.comments', 'comment', qb =>
        qb.andWhere('comment.deletedAt IS NULL'),
      )
      .where('post.status = :status', { status })
      .distinct(true);

    // 피드/조건
    if (feed === 'following') {
      const safeUserId = userId?.trim();
      if (!safeUserId) {
        const code = ERROR_CODES.AUTH_LOGIN_REQUIRED as ErrorCode;
        throw new UnauthorizedException({ message: AUTH_ERROR_MESSAGES.LOGIN_REQUIRED, code });
      }

      queryBuilder.innerJoin(
        Follow,
        'follow',
        'follow.followingId = post.authorId AND follow.followerId = :followerId',
        { followerId: safeUserId },
      );
    }

    // 필터/조건
    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    }

    // 목록/조회
    const [posts, total] = await queryBuilder
      .orderBy(`post.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 응답/반환
    return {
      items: posts.map(post => this.buildPostListItem(post)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 좋아요 목록
   * @description 사용자가 좋아요한 게시글을 조회
   */
  async getLikedPosts(query: ListPostsQueryDto, userId: string) {
    // 페이징/정렬
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const order = query.order ?? SortOrder.DESC;
    const sort = query.sort ?? PostSortOption.CREATED_AT;

    // 목록/쿼리
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(PostLike, 'postLike', 'postLike.postId = post.id AND postLike.userId = :userId', { userId })
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postTags', 'postTags')
      .leftJoinAndSelect('postTags.tag', 'tag')
      .loadRelationCountAndMap('post.commentCount', 'post.comments', 'comment', qb =>
        qb.andWhere('comment.deletedAt IS NULL'),
      )
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .distinct(true);

    // 필터/조건
    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    }

    // 목록/조회
    const [posts, total] = await queryBuilder
      .orderBy(`post.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 응답/반환
    return {
      items: posts.map(post => this.buildPostListItem(post)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 임시저장 목록
   * @description 작성자의 임시저장 목록을 조회
   */
  async getDrafts(query: ListPostsQueryDto, authorId: string) {
    // 페이징/정렬
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const order = query.order ?? SortOrder.DESC;
    const sort = query.sort ?? PostSortOption.CREATED_AT;

    // 목록/쿼리
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.status = :status', { status: PostStatus.DRAFT })
      .andWhere('post.authorId = :authorId', { authorId });

    // 필터/조건
    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    // 목록/조회
    const [posts, total] = await queryBuilder
      .orderBy(`post.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 응답/반환
    return {
      items: posts.map(post => this.buildDraftListItem(post)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 임시저장 상세
   * @description 특정 임시저장 게시글을 조회
   */
  async getDraft(postId: string, authorId: string) {
    // 대상/조회
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

    // 예외/처리
    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    // 응답/반환
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

  /**
   * 게시글 생성
   * @description 게시글을 생성
   */
  async createPost(payload: CreatePostDto, authorId: string) {
    // 입력/정규화
    const rawTags = payload.tags ?? [];
    const status = payload.status ?? PostStatus.DRAFT;
    const categoryId = payload.categoryId?.trim() || null;
    const normalizedTags = this.normalizeTagNames(rawTags);

    if (status === PostStatus.PUBLISHED) {
      ensurePublishFields({
        title: payload.title,
        content: payload.content,
        categoryId,
      });
    }

    return this.postsRepository.manager.transaction(async manager => {
      // 레포/확보
      const tagRepository = manager.getRepository(Tag);
      const postRepository = manager.getRepository(Post);
      const postTagRepository = manager.getRepository(PostTag);
      const postImageRepository = manager.getRepository(PostImage);

      // 게시글/생성
      const post = postRepository.create({
        id: this.snowflakeService.generate(),
        authorId,
        categoryId,
        title: payload.title,
        content: payload.content,
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
      });

      // 게시글/저장
      const savedPost = await postRepository.save(post);

      // 태그/처리
      if (normalizedTags.length) {
        const tagMap = await this.upsertTags(tagRepository, normalizedTags);
        await this.savePostTags(postTagRepository, savedPost.id, Array.from(tagMap.values()));
      }

      // 이미지/처리
      await postImageRepository.delete({ postId: savedPost.id });
      const postImages = this.buildPostImages(savedPost, postImageRepository);
      if (postImages.length) {
        await postImageRepository.save(postImages);
      }

      return { id: savedPost.id };
    });
  }

  /**
   * 게시글 수정
   * @description 게시글을 수정
   */
  async updatePost(postId: string, payload: UpdatePostDto, authorId: string) {
    return this.postsRepository.manager.transaction(async manager => {
      // 레포/확보
      const tagRepository = manager.getRepository(Tag);
      const postRepository = manager.getRepository(Post);
      const postTagRepository = manager.getRepository(PostTag);
      const postImageRepository = manager.getRepository(PostImage);

      // 대상/조회
      const post = await postRepository.findOne({
        where: { id: postId, authorId },
        relations: {
          postTags: {
            tag: true,
          },
        },
      });

      // 예외/처리
      if (!post) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }

      // 다음값/계산
      const nextTitle = payload.title ?? post.title;
      const nextStatus = payload.status ?? post.status;
      const nextContent = payload.content ?? post.content;
      const normalizedCategoryId = payload.categoryId !== undefined ? payload.categoryId?.trim() || null : undefined;
      const nextCategoryId = normalizedCategoryId !== undefined ? normalizedCategoryId : post.categoryId;

      if (nextStatus === PostStatus.PUBLISHED) {
        ensurePublishFields({
          title: nextTitle,
          content: nextContent,
          categoryId: nextCategoryId,
        });
      }

      // 값/반영
      if (payload.title !== undefined) post.title = payload.title;
      if (payload.content !== undefined) post.content = payload.content;
      if (normalizedCategoryId !== undefined) post.categoryId = normalizedCategoryId;
      if (payload.thumbnailUrl !== undefined) {
        post.thumbnailUrl = payload.thumbnailUrl.trim() ? payload.thumbnailUrl : null;
      }
      if (payload.status !== undefined) {
        post.status = payload.status;
        if (payload.status === PostStatus.PUBLISHED && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }

      // 저장/처리
      const savedPost = await postRepository.save(post);

      // 태그/처리
      if (payload.tags !== undefined) {
        await postTagRepository.delete({ postId: savedPost.id });

        const normalizedTags = this.normalizeTagNames(payload.tags);
        if (normalizedTags.length) {
          const tagMap = await this.upsertTags(tagRepository, normalizedTags);
          await this.savePostTags(postTagRepository, savedPost.id, Array.from(tagMap.values()));
        }
      }

      // 이미지/처리
      await postImageRepository.delete({ postId: savedPost.id });
      const postImages = this.buildPostImages(savedPost, postImageRepository);
      if (postImages.length) {
        await postImageRepository.save(postImages);
      }

      return { id: savedPost.id };
    });
  }

  /**
   * 게시글 삭제
   * @description 게시글을 삭제
   */
  async deletePost(postId: string, authorId: string) {
    // 대상/조회
    const post = await this.postsRepository.findOne({
      where: { id: postId, authorId },
      select: { id: true },
    });

    // 예외/처리
    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    // 삭제/처리
    await this.postsRepository.delete({ id: postId, authorId });
    return { id: postId };
  }

  /**
   * 게시글 상세
   * @description 게시글 상세 정보를 조회
   */
  async getPostDetail(postId: string, userId?: string | null) {
    // 대상/조회
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

    // 예외/처리
    if (!post) {
      const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
      throw new NotFoundException({
        message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
        code,
      });
    }

    // 보조/데이터
    const normalizedUserId = userId?.trim() || null;
    const authorId = post.author?.id ?? null;
    const isAuthorFollowLookupEnabled = Boolean(normalizedUserId && authorId && normalizedUserId !== authorId);

    const [liked, commentCount, followerCount, isFollowing] = await Promise.all([
      normalizedUserId ? this.postLikeRepository.exist({ where: { postId, userId: normalizedUserId } }) : false,
      this.commentsRepository.count({ where: { postId: post.id, deletedAt: IsNull() } }),
      authorId ? this.followsRepository.count({ where: { followingId: authorId } }) : 0,
      isAuthorFollowLookupEnabled
        ? this.followsRepository.exist({ where: { followerId: normalizedUserId!, followingId: authorId } })
        : false,
    ]);

    // 응답/반환
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount,
      liked,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      category: post.category ? { id: post.category.id, name: post.category.name } : null,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            role: post.author.role,
            profileImageUrl: post.author.profileImageUrl ?? null,
            profileHandle: post.author.profileHandle ?? null,
            profileBio: post.author.profileBio ?? null,
            followerCount,
            isFollowing,
          }
        : null,
      tags: post.postTags?.map(postTag => ({ id: postTag.tag.id, name: postTag.tag.name })) ?? [],
    };
  }

  /**
   * 공유 카운트 증가
   * @description 공유 로그를 기반으로 공유 수를 증가
   */
  async incrementShareCount(
    postId: string,
    ip: string,
    userAgent: string,
    userId?: string | null,
  ): Promise<{ shareCount: number }> {
    // 시간/윈도우
    const now = Date.now();
    const windowStart = new Date(now - SHARE_WINDOW_MINUTES * 60 * 1000);

    // 입력/정규화
    const safeIp = ip?.trim() || 'unknown';
    const safeUserId = userId?.trim() || null;
    const safeUserAgent = userAgent?.trim() || 'unknown';

    // 로그/확인
    const existingLog = safeUserId
      ? await this.postShareLogRepository.findOne({
          where: { postId, userId: safeUserId, createdAt: MoreThan(windowStart) },
        })
      : await this.postShareLogRepository.findOne({
          where: { postId, ip: safeIp, userAgent: safeUserAgent, createdAt: MoreThan(windowStart) },
        });

    if (!existingLog) {
      // 카운트/증가
      const result = await this.postsRepository.increment(
        { id: postId, status: PostStatus.PUBLISHED },
        'shareCount',
        1,
      );

      // 예외/처리
      if (!result.affected) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }

      // 로그/저장
      const log = this.postShareLogRepository.create({
        id: this.snowflakeService.generate(),
        postId,
        userId: safeUserId,
        ip: safeIp.slice(0, 64),
        userAgent: safeUserAgent.slice(0, 255),
      });
      await this.postShareLogRepository.save(log);
    } else {
      // 대상/확인
      const postExists = await this.postsRepository.findOne({
        where: { id: postId, status: PostStatus.PUBLISHED },
        select: { id: true },
      });

      if (!postExists) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }
    }

    // 결과/조회
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      select: { id: true, shareCount: true },
    });

    return {
      shareCount: post?.shareCount ?? 0,
    };
  }

  /**
   * 좋아요 토글
   * @description 좋아요 상태를 토글
   */
  async toggleLikeCount(postId: string, userId: string): Promise<{ likeCount: number; liked: boolean }> {
    // 입력/정규화
    const safeUserId = userId.trim();

    return this.postsRepository.manager.transaction(async manager => {
      // 레포/확보
      const postRepository = manager.getRepository(Post);
      const likeRepository = manager.getRepository(PostLike);

      // 대상/조회
      const post = await postRepository.findOne({
        where: { id: postId, status: PostStatus.PUBLISHED },
        select: { id: true, likeCount: true, authorId: true },
      });

      // 예외/처리
      if (!post) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }

      // 기존/확인
      const existing = await likeRepository.findOne({ where: { postId, userId: safeUserId } });
      let liked = false;

      // 토글/처리
      if (existing) {
        await likeRepository.delete({ postId, userId: safeUserId });
        await postRepository.decrement({ id: postId }, 'likeCount', 1);
      } else {
        const like = likeRepository.create({ postId, userId: safeUserId });
        await likeRepository.save(like);
        await postRepository.increment({ id: postId }, 'likeCount', 1);
        liked = true;
      }

      // 알림/처리
      if (liked && post.authorId) {
        await this.notificationsService.createNotification({
          actorUserId: safeUserId,
          targetUserId: post.authorId,
          type: NotificationType.POST_LIKE,
          postId: post.id,
        });
      }

      // 결과/조회
      const updated = await postRepository.findOne({
        where: { id: postId },
        select: { id: true, likeCount: true },
      });

      return {
        likeCount: updated?.likeCount ?? post.likeCount,
        liked,
      };
    });
  }

  /**
   * 조회수 증가
   * @description 조회 로그를 기반으로 조회수를 증가
   */
  async incrementViewCount(
    postId: string,
    ip: string,
    userAgent: string,
    anonymousId: string,
  ): Promise<{ viewCount: number }> {
    // 시간/윈도우
    const now = Date.now();
    const windowStart = new Date(now - VIEW_WINDOW_HOURS * 60 * 60 * 1000);

    // 입력/정규화
    const safeIp = ip?.trim() || 'unknown';
    const safeUserAgent = userAgent?.trim() || 'unknown';
    const safeAnonymousId = anonymousId?.trim() || 'unknown';

    // 로그/확인
    const existingLog = await this.postViewLogRepository.findOne({
      where: {
        postId,
        anonymousId: safeAnonymousId,
        ip: safeIp,
        userAgent: safeUserAgent,
        createdAt: MoreThan(windowStart),
      },
    });

    if (!existingLog) {
      // 카운트/증가
      const result = await this.postsRepository.increment({ id: postId, status: PostStatus.PUBLISHED }, 'viewCount', 1);

      // 예외/처리
      if (!result.affected) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }

      // 로그/저장
      const log = this.postViewLogRepository.create({
        id: this.snowflakeService.generate(),
        postId,
        anonymousId: safeAnonymousId,
        ip: safeIp.slice(0, 64),
        userAgent: safeUserAgent.slice(0, 255),
      });
      await this.postViewLogRepository.save(log);
    } else {
      // 대상/확인
      const postExists = await this.postsRepository.findOne({
        where: { id: postId, status: PostStatus.PUBLISHED },
        select: { id: true },
      });

      if (!postExists) {
        const code = ERROR_CODES.POST_NOT_FOUND as ErrorCode;
        throw new NotFoundException({
          message: POST_ERROR_MESSAGES.POST_NOT_FOUND,
          code,
        });
      }
    }

    // 결과/조회
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      select: { id: true, viewCount: true },
    });

    return {
      viewCount: post?.viewCount ?? 0,
    };
  }

  /**
   * 게시글 목록 아이템
   * @description 목록용 게시글 정보를 반환
   */
  private buildPostListItem(post: Post) {
    // 기본/정보
    const commentCount = post.commentCount ?? 0;
    const category = post.category ? { id: post.category.id, name: post.category.name } : null;
    const tags = post.postTags?.map(postTag => ({ id: postTag.tag.id, name: postTag.tag.name })) ?? [];
    const author = post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          role: post.author.role,
          profileImageUrl: post.author.profileImageUrl ?? null,
        }
      : null;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl,
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      shareCount: post.shareCount,
      commentCount,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      category,
      tags,
      author,
    };
  }

  /**
   * 임시저장 아이템
   * @description 임시저장 목록용 데이터를 반환
   */
  private buildDraftListItem(post: Post) {
    // 기본/정보
    const category = post.category ? { id: post.category.id, name: post.category.name } : null;

    return {
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
      category,
      author: null,
    };
  }

  /**
   * 태그 정규화
   * @description 태그 문자열을 정리
   */
  private normalizeTagNames(tags: string[]) {
    return tags.map(tag => tag.trim().replace(/^#+/, '')).filter(Boolean);
  }

  /**
   * 태그 업서트
   * @description 기존 태그를 보존하고 필요한 태그를 생성
   */
  private async upsertTags(tagRepository: Repository<Tag>, names: string[]) {
    // 빠른/종료
    if (!names.length) return new Map<string, Tag>();

    // 기존/조회
    const existingTags = await tagRepository.find({
      where: { name: In(names) },
    });
    const tagMap = new Map(existingTags.map(tag => [tag.name, tag]));

    // 신규/생성
    for (const name of names) {
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

    return tagMap;
  }

  /**
   * 태그 저장
   * @description 게시글 태그 관계를 저장
   */
  private async savePostTags(postTagRepository: Repository<PostTag>, postId: string, tags: Tag[]) {
    // 빠른/종료
    if (!tags.length) return;

    // 관계/생성
    const postTags = tags.map(tag =>
      postTagRepository.create({
        postId,
        tagId: tag.id,
      }),
    );

    // 관계/저장
    if (postTags.length) {
      await postTagRepository.save(postTags);
    }
  }
}
