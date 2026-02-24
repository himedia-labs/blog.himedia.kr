import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'admin_audit_logs' })
@Index(['adminUserId', 'createdAt'])
@Index(['targetType', 'targetId', 'createdAt'])
export class AdminAuditLog {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'admin_user_id', type: 'bigint' })
  adminUserId!: string;

  @Column({ name: 'target_type', type: 'varchar', length: 40 })
  targetType!: string;

  @Column({ name: 'target_id', type: 'varchar', length: 100 })
  targetId!: string;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
