import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Post } from '@/posts/entities/post.entity';
import { User } from '@/auth/entities/user.entity';

@Entity({ name: 'post_likes' })
@Index(['userId'])
export class PostLike {
  @PrimaryColumn({ name: 'post_id', type: 'bigint' })
  postId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Post, post => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
