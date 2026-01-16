import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'post_share_logs' })
@Index(['postId', 'userId', 'createdAt'])
@Index(['postId', 'ip', 'userAgent', 'createdAt'])
export class PostShareLog {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'post_id', type: 'bigint' })
  postId!: string;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  ip!: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255 })
  userAgent!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
