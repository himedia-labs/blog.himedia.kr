import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tag } from '@/posts/entities/tag.entity';
import { TagSuggestQueryDto } from '@/posts/dto/tagSuggestQuery.dto';

@Injectable()
export class TagsService {
  /**
   * 태그 서비스
   * @description 태그 추천을 담당
   */
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  /**
   * 태그 추천
   * @description 검색어 기준 태그 목록을 반환
   */
  async getTagSuggestions(query: TagSuggestQueryDto) {
    // 입력/정규화
    const keyword = query.query?.trim();

    if (!keyword) return [];

    // 목록/조회
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

    // 제한/적용
    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    // 결과/변환
    const tags = await queryBuilder.getRawMany();

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      postCount: Number(tag.postCount ?? 0),
    }));
  }
}
