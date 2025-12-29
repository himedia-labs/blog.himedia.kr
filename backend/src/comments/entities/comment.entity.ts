import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { CommentReaction } from './commentReaction.entity';

@Entity({ name: 'comments' })
@Index(['postId'])
@Index(['parentId'])
@Index(['createdAt'])
@Index(['id', 'postId'], { unique: true })
export class Comment {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'post_id', type: 'bigint' })
  postId!: string;

  @Column({ name: 'author_id', type: 'bigint' })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  parentId!: string | null;

  @Column({ type: 'int', default: 0 })
  depth!: number;

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount!: number;

  @Column({ name: 'dislike_count', type: 'int', default: 0 })
  dislikeCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Post, post => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Comment, comment => comment.children, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([
    { name: 'parent_id', referencedColumnName: 'id' },
    { name: 'post_id', referencedColumnName: 'postId' },
  ])
  parent!: Comment | null;

  @OneToMany(() => Comment, comment => comment.parent)
  children!: Comment[];

  @OneToMany(() => CommentReaction, reaction => reaction.comment)
  reactions!: CommentReaction[];
}
