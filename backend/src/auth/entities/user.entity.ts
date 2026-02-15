import { Check, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { RefreshToken } from '@/auth/entities/refreshToken.entity';

// 권한
export enum UserRole {
  TRAINEE = 'TRAINEE',
  GRADUATE = 'GRADUATE',
  MENTOR = 'MENTOR',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

@Check('users_role_check', "\"role\" IN ('TRAINEE', 'GRADUATE', 'MENTOR', 'INSTRUCTOR', 'ADMIN')")
@Check('users_requested_role_check', "\"requested_role\" IN ('TRAINEE', 'GRADUATE', 'MENTOR', 'INSTRUCTOR')")
@Entity({ name: 'users' })
@Index(['email'])
@Index(['role'])
@Index(['approved'])
@Index(['withdrawn'])
@Index(['withdrawRestoreDeadline'])
@Index(['role', 'approved'])
@Index(['profileHandle'])
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

  @Column({ type: 'varchar', length: 20, name: 'requested_role', nullable: true })
  requestedRole!: UserRole | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course!: string | null;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'profile_handle', unique: true, nullable: true })
  profileHandle!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_image_url', nullable: true })
  profileImageUrl!: string | null;

  @Column({ type: 'text', name: 'profile_bio', nullable: true })
  profileBio!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'profile_contact_email', nullable: true })
  profileContactEmail!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_github_url', nullable: true })
  profileGithubUrl!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_linkedin_url', nullable: true })
  profileLinkedinUrl!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_twitter_url', nullable: true })
  profileTwitterUrl!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_facebook_url', nullable: true })
  profileFacebookUrl!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_website_url', nullable: true })
  profileWebsiteUrl!: string | null;

  @Column({ type: 'boolean', name: 'privacy_consent', default: false })
  privacyConsent!: boolean;

  @Column({ type: 'boolean', default: false })
  approved!: boolean;

  @Column({ type: 'boolean', default: false })
  withdrawn!: boolean;

  @Column({ type: 'timestamp', name: 'withdrawn_at', nullable: true })
  withdrawnAt!: Date | null;

  @Column({ type: 'timestamp', name: 'withdraw_restore_deadline', nullable: true })
  withdrawRestoreDeadline!: Date | null;

  @Column({ type: 'varchar', length: 255, name: 'withdraw_note', nullable: true })
  withdrawNote!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens!: RefreshToken[];
}
