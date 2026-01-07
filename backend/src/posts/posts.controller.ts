import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import { PostsService } from './posts.service';
import { ListPostsQueryDto } from './dto/listPostsQuery.dto';
import { CreatePostDto } from './dto/createPost.dto';

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

  @Get(':postId')
  getPostDetail(@Param('postId') postId: string) {
    return this.postsService.getPostDetail(postId);
  }
}
