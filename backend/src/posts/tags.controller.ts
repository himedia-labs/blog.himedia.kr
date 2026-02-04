import { Controller, Get, Query } from '@nestjs/common';

import { TagsService } from '@/posts/tags.service';
import { TagSuggestQueryDto } from '@/posts/dto/tagSuggestQuery.dto';

@Controller('tags')
export class TagsController {
  /**
   * 태그 컨트롤러
   * @description 태그 관련 요청을 처리
   */
  constructor(private readonly tagsService: TagsService) {}

  /**
   * 태그 추천
   * @description 태그 추천 목록을 반환
   */
  @Get('suggest')
  getTagSuggestions(@Query() query: TagSuggestQueryDto) {
    return this.tagsService.getTagSuggestions(query);
  }
}
