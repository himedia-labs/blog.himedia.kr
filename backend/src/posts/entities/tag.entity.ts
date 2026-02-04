import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { PostTag } from '@/posts/entities/postTag.entity';

@Entity({ name: 'tags' })
export class Tag {
  @PrimaryColumn({ type: 'bigint' })
  id!: string;

  @Column({ length: 50, unique: true })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => PostTag, postTag => postTag.tag)
  postTags!: PostTag[];
}
