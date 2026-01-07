import { Controller, Get, Query } from '@nestjs/common';

import { TagsService } from './tags.service';
import { TagSuggestQueryDto } from './dto/tagSuggestQuery.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('suggest')
  getTagSuggestions(@Query() query: TagSuggestQueryDto) {
    return this.tagsService.getTagSuggestions(query);
  }
}
