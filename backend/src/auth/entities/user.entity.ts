import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { RefreshToken } from './refreshToken.entity';

// 권한
export enum UserRole {
  TRAINEE = 'TRAINEE',
  MENTOR = 'MENTOR',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

@Entity({ name: 'users' })
@Index(['email'])
@Index(['role'])
@Index(['approved'])
@Index(['role', 'approved'])
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 20, unique: true })
  phone!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course!: string | null;

  @Column({ type: 'boolean', name: 'privacy_consent', default: false })
  privacyConsent!: boolean;

  @Column({ type: 'boolean', default: false })
  approved!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens!: RefreshToken[];
}
