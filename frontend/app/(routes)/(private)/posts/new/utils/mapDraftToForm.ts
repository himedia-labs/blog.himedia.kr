import type { DraftData, PostDetailResponse } from '@/app/shared/types/post';

/**
 * draft 상세 데이터 -> 폼 데이터 변환
 * @description 초안 상세 데이터를 폼 구조로 변환
 */
export const mapDraftToForm = (draft: PostDetailResponse): DraftData => ({
  title: draft.title ?? '',
  categoryId: draft.category?.id ?? '',
  content: draft.content ?? '',
  tags: draft.tags?.map(tag => tag.name) ?? [],
});
