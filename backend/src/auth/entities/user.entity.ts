import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refreshToken.entity';

export enum UserRole {
  TRAINEE = 'TRAINEE',
  MENTOR = 'MENTOR',
  INSTRUCTOR = 'INSTRUCTOR',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
