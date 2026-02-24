import { Check, Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// 신고 상태
export enum AdminReportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Check('admin_reports_status_check', "\"status\" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')")
@Entity({ name: 'admin_reports' })
@Index(['status', 'createdAt'])
@Index(['createdAt'])
export class AdminReport {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'reporter_user_id', type: 'bigint', nullable: true })
  reporterUserId!: string | null;

  @Column({ name: 'handler_admin_id', type: 'bigint', nullable: true })
  handlerAdminId!: string | null;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20, default: AdminReportStatus.OPEN })
  status!: AdminReportStatus;

  @Column({ name: 'handled_at', type: 'timestamp', nullable: true })
  handledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
