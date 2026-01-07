import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tag } from './entities/tag.entity';
import { TagSuggestQueryDto } from './dto/tagSuggestQuery.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async getTagSuggestions(query: TagSuggestQueryDto) {
    const keyword = query.query?.trim();
    if (!keyword) {
      return [];
    }

    const queryBuilder = this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.postTags', 'postTag')
      .select('tag.id', 'id')
      .addSelect('tag.name', 'name')
      .addSelect('COUNT(postTag.tagId)', 'postCount')
      .where('tag.name ILIKE :keyword', { keyword: `${keyword}%` })
      .groupBy('tag.id')
      .orderBy('COUNT(postTag.tagId)', 'DESC')
      .addOrderBy('tag.name', 'ASC');

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    const tags = await queryBuilder.getRawMany();

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      postCount: Number(tag.postCount ?? 0),
    }));
  }
}
