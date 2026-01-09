import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Post } from './post.entity';

export enum PostImageType {
  THUMBNAIL = 'THUMBNAIL',
  CONTENT = 'CONTENT',
}

@Entity({ name: 'post_images' })
@Index(['postId'])
@Index(['type'])
export class PostImage {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'post_id', type: 'bigint' })
  postId!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: PostImageType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Post, post => post.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}
