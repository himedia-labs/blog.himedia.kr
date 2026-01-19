import type { DraftData, PostDetailResponse } from '@/app/shared/types/post';

import { renderMarkdownPreview } from '@/app/shared/utils/markdownPreview';

/**
 * 태그 입력 토큰 분리
 * @description 입력 문자열에서 태그 후보를 추출합니다.
 */
export const extractTags = (input: string) =>
  input
    .split(/[,\s]+/)
    .map(tag => tag.replace(/^#+/, '').trim())
    .filter(Boolean);

/**
 * 태그 추천 검색어 추출
 * @description 태그 추천용 검색어를 파싱합니다.
 */
export const getTagQueryFromInput = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  return (
    trimmed
      .replace(/^#+/, '')
      .split(/[,\s]+/)
      .filter(Boolean)
      .pop() ?? ''
  );
};

/**
 * 미리보기 날짜 생성
 * @description 미리보기용 날짜 문자열을 생성합니다.
 */
export const formatDateLabel = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '.');

/**
 * 마크다운 본문 렌더링
 * @description 마크다운을 미리보기용 요소로 변환합니다.
 */
export { renderMarkdownPreview };

/**
 * draft 상세 데이터 -> 폼 데이터 변환
 * @description 초안 상세 데이터를 폼 구조로 변환합니다.
 */
export const mapDraftToForm = (draft: PostDetailResponse): DraftData => ({
  title: draft.title ?? '',
  categoryId: draft.category?.id ?? '',
  thumbnailUrl: draft.thumbnailUrl ?? '',
  content: draft.content ?? '',
  tags: draft.tags?.map(tag => tag.name) ?? [],
});
