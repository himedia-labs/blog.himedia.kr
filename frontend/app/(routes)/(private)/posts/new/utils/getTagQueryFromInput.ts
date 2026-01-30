/**
 * 태그 추천 검색어 추출
 * @description 태그 추천용 검색어를 파싱
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
