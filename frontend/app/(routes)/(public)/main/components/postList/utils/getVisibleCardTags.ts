type VisibleCardTagsResult = {
  hiddenCount: number;
  visibleTags: string[];
};

/**
 * 카드 태그 노출 목록 계산
 * @description 카드 한 줄 문자 예산 기준으로 노출 태그와 숨김 개수 반환
 */
export const getVisibleCardTags = (tags: string[], maxCharacters = 30): VisibleCardTagsResult => {
  // 노출 태그 계산
  const visibleTags = tags.reduce<string[]>((acc, tag) => {
    const currentLength = acc.reduce((sum, item) => sum + item.length, 0);
    const nextLength = currentLength + tag.length + (acc.length > 0 ? 1 : 0);

    if (nextLength > maxCharacters) return acc;
    acc.push(tag);
    return acc;
  }, []);

  // 숨김 태그 계산
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  return { visibleTags, hiddenCount };
};
