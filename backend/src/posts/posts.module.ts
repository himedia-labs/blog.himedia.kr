import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '@/comments/entities/comment.entity';
import { OptionalJwtGuard } from '@/auth/guards/optional-jwt.guard';
import { SnowflakeService } from '@/common/services/snowflake.service';
import { NotificationsModule } from '@/notifications/notifications.module';

import { TagsService } from '@/posts/tags.service';
import { PostsService } from '@/posts/posts.service';
import { TagsController } from '@/posts/tags.controller';
import { PostsController } from '@/posts/posts.controller';
import { CategoriesService } from '@/posts/categories.service';
import { CategoriesController } from '@/posts/categories.controller';

import { Tag } from '@/posts/entities/tag.entity';
import { Post } from '@/posts/entities/post.entity';
import { PostTag } from '@/posts/entities/postTag.entity';
import { Category } from '@/posts/entities/category.entity';
import { PostLike } from '@/posts/entities/postLike.entity';
import { PostImage } from '@/posts/entities/postImage.entity';
import { PostViewLog } from '@/posts/entities/postViewLog.entity';
import { PostShareLog } from '@/posts/entities/postShareLog.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Category, Tag, PostTag, PostLike, PostImage, PostShareLog, PostViewLog, Comment]),
    NotificationsModule,
  ],
  controllers: [PostsController, CategoriesController, TagsController],
  providers: [PostsService, CategoriesService, TagsService, SnowflakeService, OptionalJwtGuard],
})
export class PostsModule {}
