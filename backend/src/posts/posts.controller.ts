import { Body, Controller, Get, Param, Patch, Post, Query, Request, Response, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { PostsService } from './posts.service';
import { ListPostsQueryDto } from './dto/listPostsQuery.dto';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { INTERACTION_CONFIG } from '../constants/config/interaction.config';

import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly configService: ConfigService,
  ) {}

  private getAnonymousId(req: ExpressRequest, res: ExpressResponse): string {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const existing = cookies?.[INTERACTION_CONFIG.ANONYMOUS_COOKIE_NAME];
    if (existing?.trim()) return existing;

    const env = this.configService.get<string>('env');
    const maxAgeMs = INTERACTION_CONFIG.ANONYMOUS_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const anonymousId = randomUUID();

    res.cookie(INTERACTION_CONFIG.ANONYMOUS_COOKIE_NAME, anonymousId, {
      httpOnly: true,
      secure: env === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return anonymousId;
  }

  @Get()
  @UseGuards(OptionalJwtGuard)
  getPosts(@Query() query: ListPostsQueryDto, @Request() req: ExpressRequest & { user?: JwtPayload }) {
    return this.postsService.getPosts(query, req.user?.sub);
  }

  @UseGuards(JwtGuard)
  @Post()
  createPost(@Body() body: CreatePostDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.postsService.createPost(body, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('drafts')
  getDrafts(@Query() query: ListPostsQueryDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.postsService.getDrafts(query, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('drafts/:postId')
  getDraft(@Param('postId') postId: string, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.postsService.getDraft(postId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch(':postId')
  updatePost(
    @Param('postId') postId: string,
    @Body() body: UpdatePostDto,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    return this.postsService.updatePost(postId, body, req.user.sub);
  }

  @Get(':postId')
  @UseGuards(OptionalJwtGuard)
  getPostDetail(@Param('postId') postId: string, @Request() req: ExpressRequest & { user?: JwtPayload }) {
    return this.postsService.getPostDetail(postId, req.user?.sub);
  }

  @Post(':postId/share')
  @UseGuards(OptionalJwtGuard)
  incrementShareCount(
    @Param('postId') postId: string,
    @Request() req: ExpressRequest & { user?: JwtPayload },
  ): Promise<{ shareCount: number }> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ip = rawIp?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    return this.postsService.incrementShareCount(postId, ip, userAgent, req.user?.sub);
  }

  @Post(':postId/view')
  incrementViewCount(
    @Param('postId') postId: string,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ viewCount: number }> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ip = rawIp?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const anonymousId = this.getAnonymousId(req, res);
    return this.postsService.incrementViewCount(postId, ip, userAgent, anonymousId);
  }

  @UseGuards(JwtGuard)
  @Post(':postId/like')
  toggleLike(
    @Param('postId') postId: string,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ): Promise<{ likeCount: number; liked: boolean }> {
    return this.postsService.toggleLikeCount(postId, req.user.sub);
  }
}
