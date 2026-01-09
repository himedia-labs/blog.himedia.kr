import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Category } from './category.entity';
import { PostLike } from './postLike.entity';
import { PostTag } from './postTag.entity';
import { PostImage } from './postImage.entity';

// 게시글 상태
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Check('posts_status_check', "\"status\" IN ('DRAFT', 'PUBLISHED')")
@Check('chk_posts_published_at', "status <> 'PUBLISHED' OR published_at IS NOT NULL")
@Check('chk_posts_category_required', "status <> 'PUBLISHED' OR category_id IS NOT NULL")
@Entity({ name: 'posts' })
@Index(['authorId'])
@Index(['categoryId'])
@Index(['status', 'createdAt'])
@Index(['createdAt'])
export class Post {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'author_id', type: 'bigint' })
  authorId!: string;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId!: string | null;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount!: number;

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'varchar', length: 20, default: PostStatus.DRAFT })
  status!: PostStatus;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @OneToMany(() => PostTag, postTag => postTag.post)
  postTags!: PostTag[];

  @OneToMany(() => PostLike, postLike => postLike.post)
  likes!: PostLike[];

  @OneToMany(() => Comment, comment => comment.post)
  comments!: Comment[];

  @OneToMany(() => PostImage, image => image.post)
  images!: PostImage[];

  commentCount?: number;

  @BeforeInsert()
  @BeforeUpdate()
  private syncThumbnailUrl() {
    if (this.thumbnailUrl) return;
    const content = this.content ?? '';
    const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (htmlMatch?.[1]) {
      this.thumbnailUrl = htmlMatch[1];
      return;
    }
    const markdownMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
    this.thumbnailUrl = markdownMatch?.[1] ?? null;
  }
}
