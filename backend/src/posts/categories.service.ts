import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '@/posts/entities/category.entity';

@Injectable()
export class CategoriesService {
  /**
   * 카테고리 서비스
   * @description 카테고리 조회를 담당
   */
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * 카테고리 목록
   * @description 카테고리 리스트를 반환
   */
  async getCategories() {
    // 목록/조회
    return this.categoriesRepository.find({
      select: { id: true, name: true },
      order: { id: 'ASC' },
    });
  }
}
