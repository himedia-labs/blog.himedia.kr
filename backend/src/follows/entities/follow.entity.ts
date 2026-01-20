import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';

@Entity({ name: 'user_follows' })
@Index(['followerId'])
@Index(['followingId'])
export class Follow {
  @PrimaryColumn({ name: 'follower_id', type: 'bigint' })
  followerId!: string;

  @PrimaryColumn({ name: 'following_id', type: 'bigint' })
  followingId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: User;
}
