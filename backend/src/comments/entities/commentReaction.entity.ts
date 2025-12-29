import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Comment } from './comment.entity';

// 댓글 리액션 타입
export enum CommentReactionType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
}

@Check('comment_reactions_type_check', "\"type\" IN ('LIKE', 'DISLIKE')")
@Entity({ name: 'comment_reactions' })
@Index(['userId'])
export class CommentReaction {
  @PrimaryColumn({ name: 'comment_id', type: 'bigint' })
  commentId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: CommentReactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Comment, comment => comment.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
