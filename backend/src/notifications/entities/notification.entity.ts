import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '@/auth/entities/user.entity';
import { Post } from '@/posts/entities/post.entity';
import { Comment } from '@/comments/entities/comment.entity';

export enum NotificationType {
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  COMMENT_LIKE = 'COMMENT_LIKE',
  COMMENT_REPLY = 'COMMENT_REPLY',
}

@Check('notifications_type_check', "\"type\" IN ('POST_LIKE', 'POST_COMMENT', 'COMMENT_LIKE', 'COMMENT_REPLY')")
@Entity({ name: 'notifications' })
@Index(['targetUserId', 'createdAt'])
@Index(['targetUserId', 'readAt'])
export class Notification {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'target_user_id', type: 'bigint' })
  targetUserId!: string;

  @Column({ name: 'actor_user_id', type: 'bigint' })
  actorUserId!: string;

  @Column({ name: 'post_id', type: 'bigint', nullable: true })
  postId!: string | null;

  @Column({ name: 'comment_id', type: 'bigint', nullable: true })
  commentId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  type!: NotificationType;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post!: Post | null;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment | null;
}
