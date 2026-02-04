import { Controller, Get } from '@nestjs/common';

import { CategoriesService } from '@/posts/categories.service';

@Controller('categories')
export class CategoriesController {
  /**
   * 카테고리 컨트롤러
   * @description 카테고리 관련 요청을 처리
   */
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * 카테고리 목록
   * @description 카테고리 리스트를 반환
   */
  @Get()
  getCategories() {
    return this.categoriesService.getCategories();
  }
}
