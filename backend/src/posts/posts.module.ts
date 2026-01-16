import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { SnowflakeService } from '../common/services/snowflake.service';
import { Category } from './entities/category.entity';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/postImage.entity';
import { PostLike } from './entities/postLike.entity';
import { PostTag } from './entities/postTag.entity';
import { PostShareLog } from './entities/postShareLog.entity';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, Tag, PostTag, PostLike, PostImage, PostShareLog])],
  controllers: [PostsController, CategoriesController, TagsController],
  providers: [PostsService, CategoriesService, TagsService, SnowflakeService],
})
export class PostsModule {}
