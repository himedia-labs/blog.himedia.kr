import { Controller, Get, Param, Query } from '@nestjs/common';

import { PostsService } from './posts.service';
import { ListPostsQueryDto } from './dto/listPostsQuery.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts(@Query() query: ListPostsQueryDto) {
    return this.postsService.getPosts(query);
  }

  @Get(':postId')
  getPostDetail(@Param('postId') postId: string) {
    return this.postsService.getPostDetail(postId);
  }
}
