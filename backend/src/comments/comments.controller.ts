import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CommentsService } from './comments.service';

import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import type { Request as ExpressRequest } from 'express';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  getComments(@Param('postId') postId: string, @Request() req: ExpressRequest & { user?: JwtPayload }) {
    const userId = req.user?.sub ?? null;
    return this.commentsService.getCommentsByPostId(postId, userId);
  }

  @UseGuards(JwtGuard)
  @Post()
  createComment(
    @Param('postId') postId: string,
    @Body() body: CreateCommentDto,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    return this.commentsService.createComment(postId, body, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post(':commentId/like')
  toggleLike(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    return this.commentsService.toggleCommentLike(postId, commentId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch(':commentId')
  updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() body: UpdateCommentDto,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    return this.commentsService.updateComment(postId, commentId, body, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Delete(':commentId')
  deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: ExpressRequest & { user: JwtPayload },
  ) {
    return this.commentsService.deleteComment(postId, commentId, req.user.sub);
  }
}

@Controller('comments')
export class MyCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMyComments(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.commentsService.getCommentsByAuthorId(req.user.sub);
  }
}
