import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, Response, UseGuards } from '@nestjs/common';

import { JwtGuard } from '@/auth/guards/jwt.guard';
import { OptionalJwtGuard } from '@/auth/guards/optional-jwt.guard';

import { INTERACTION_CONFIG } from '@/constants/config/interaction.config';

import { PostsService } from '@/posts/posts.service';
import { CreatePostDto } from '@/posts/dto/createPost.dto';
import { UpdatePostDto } from '@/posts/dto/updatePost.dto';
import { ListPostsQueryDto } from '@/posts/dto/listPostsQuery.dto';

import type { AuthRequest, OptionalAuthRequest } from '@/posts/posts.types';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('posts')
export class PostsController {
  /**
   * 게시글 컨트롤러
   * @description 게시글 관련 요청을 처리
   */
  constructor(
    private readonly postsService: PostsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 익명 ID 발급
   * @description 조회수 계산용 익명 ID를 쿠키에 저장
   */
  private getAnonymousId(req: ExpressRequest, res: ExpressResponse): string {
    // 쿠키/확인
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const existing = cookies?.[INTERACTION_CONFIG.ANONYMOUS_COOKIE_NAME];

    if (existing?.trim()) return existing;

    // 값/설정
    const env = this.configService.get<string>('env');
    const anonymousId = randomUUID();
    const maxAgeMs = INTERACTION_CONFIG.ANONYMOUS_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // 쿠키/저장
    res.cookie(INTERACTION_CONFIG.ANONYMOUS_COOKIE_NAME, anonymousId, {
      httpOnly: true,
      secure: env === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return anonymousId;
  }

  /**
   * 클라이언트 정보
   * @description IP와 UserAgent를 추출
   */
  private getClientMeta(req: ExpressRequest) {
    // 헤더/파싱
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    // 값/정규화
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const ip = rawIp?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';

    return { ip, userAgent };
  }

  /**
   * 게시글 목록
   * @description 게시글 리스트를 반환
   */
  @Get()
  @UseGuards(OptionalJwtGuard)
  getPosts(@Query() query: ListPostsQueryDto, @Request() req: OptionalAuthRequest) {
    return this.postsService.getPosts(query, req.user?.sub);
  }

  /**
   * 게시글 생성
   * @description 새 게시글을 생성
   */
  @UseGuards(JwtGuard)
  @Post()
  createPost(@Body() body: CreatePostDto, @Request() req: AuthRequest) {
    return this.postsService.createPost(body, req.user.sub);
  }

  /**
   * 임시저장 목록
   * @description 작성자의 임시저장 목록을 반환
   */
  @UseGuards(JwtGuard)
  @Get('drafts')
  getDrafts(@Query() query: ListPostsQueryDto, @Request() req: AuthRequest) {
    return this.postsService.getDrafts(query, req.user.sub);
  }

  /**
   * 임시저장 상세
   * @description 특정 임시저장 게시글을 반환
   */
  @UseGuards(JwtGuard)
  @Get('drafts/:postId')
  getDraft(@Param('postId') postId: string, @Request() req: AuthRequest) {
    return this.postsService.getDraft(postId, req.user.sub);
  }

  /**
   * 좋아요 목록
   * @description 사용자가 좋아요한 게시글을 반환
   */
  @UseGuards(JwtGuard)
  @Get('liked')
  getLikedPosts(@Query() query: ListPostsQueryDto, @Request() req: AuthRequest) {
    return this.postsService.getLikedPosts(query, req.user.sub);
  }

  /**
   * 게시글 수정
   * @description 게시글을 수정
   */
  @UseGuards(JwtGuard)
  @Patch(':postId')
  updatePost(@Param('postId') postId: string, @Body() body: UpdatePostDto, @Request() req: AuthRequest) {
    return this.postsService.updatePost(postId, body, req.user.sub);
  }

  /**
   * 게시글 삭제
   * @description 게시글을 삭제
   */
  @UseGuards(JwtGuard)
  @Delete(':postId')
  deletePost(@Param('postId') postId: string, @Request() req: AuthRequest) {
    return this.postsService.deletePost(postId, req.user.sub);
  }

  /**
   * 게시글 상세
   * @description 게시글 상세 정보를 반환
   */
  @Get(':postId')
  @UseGuards(OptionalJwtGuard)
  getPostDetail(@Param('postId') postId: string, @Request() req: OptionalAuthRequest) {
    return this.postsService.getPostDetail(postId, req.user?.sub);
  }

  /**
   * 공유 카운트 증가
   * @description 게시글 공유 수를 증가
   */
  @Post(':postId/share')
  @UseGuards(OptionalJwtGuard)
  incrementShareCount(
    @Param('postId') postId: string,
    @Request() req: OptionalAuthRequest,
  ): Promise<{ shareCount: number }> {
    // 클라이언트/정보
    const { ip, userAgent } = this.getClientMeta(req);

    return this.postsService.incrementShareCount(postId, ip, userAgent, req.user?.sub);
  }

  /**
   * 조회수 증가
   * @description 게시글 조회수를 증가
   */
  @Post(':postId/view')
  incrementViewCount(
    @Param('postId') postId: string,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ viewCount: number }> {
    // 클라이언트/정보
    const { ip, userAgent } = this.getClientMeta(req);

    // 익명/식별자
    const anonymousId = this.getAnonymousId(req, res);

    return this.postsService.incrementViewCount(postId, ip, userAgent, anonymousId);
  }

  /**
   * 좋아요 토글
   * @description 좋아요 상태를 토글
   */
  @UseGuards(JwtGuard)
  @Post(':postId/like')
  toggleLike(
    @Param('postId') postId: string,
    @Request() req: AuthRequest,
  ): Promise<{ likeCount: number; liked: boolean }> {
    return this.postsService.toggleLikeCount(postId, req.user.sub);
  }
}
