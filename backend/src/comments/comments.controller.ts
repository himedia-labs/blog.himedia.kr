import { Controller, Get, Param } from '@nestjs/common';

import { CommentsService } from './comments.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  getComments(@Param('postId') postId: string) {
    return this.commentsService.getCommentsByPostId(postId);
  }
}
