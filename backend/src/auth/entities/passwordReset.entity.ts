import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'password_resets' })
@Index(['userId'])
@Index(['code'])
@Index(['expiresAt'])
@Index(['userId', 'code', 'used'])
export class PasswordReset {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId!: string;

  @Column({ length: 255 })
  code!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
