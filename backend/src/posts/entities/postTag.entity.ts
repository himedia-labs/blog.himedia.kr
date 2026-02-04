import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Tag } from '@/posts/entities/tag.entity';
import { Post } from '@/posts/entities/post.entity';

@Entity({ name: 'post_tags' })
@Index(['tagId'])
export class PostTag {
  @PrimaryColumn({ name: 'post_id', type: 'bigint' })
  postId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'bigint' })
  tagId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Post, post => post.postTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => Tag, tag => tag.postTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
