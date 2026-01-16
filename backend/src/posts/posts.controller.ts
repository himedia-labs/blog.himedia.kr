import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import { PostsService } from './posts.service';
import { ListPostsQueryDto } from './dto/listPostsQuery.dto';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts(@Query() query: ListPostsQueryDto) {
    return this.postsService.getPosts(query);
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
  getPostDetail(@Param('postId') postId: string) {
    return this.postsService.getPostDetail(postId);
  }

  @Post(':postId/share')
  @UseGuards(OptionalJwtGuard)
  incrementShareCount(@Param('postId') postId: string, @Request() req: ExpressRequest & { user?: JwtPayload }) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ip = rawIp?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    return this.postsService.incrementShareCount(postId, ip, userAgent, req.user?.sub);
  }
}
