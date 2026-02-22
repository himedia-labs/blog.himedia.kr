/**
 * 카드 태그 노출 목록 계산
 * @description 카드 한 줄 문자 예산을 넘지 않는 태그만 반환
 */
export const getVisibleCardTags = (tags: string[], maxCharacters = 30) => {
  return tags.reduce<string[]>((acc, tag) => {
    const currentLength = acc.reduce((sum, item) => sum + item.length, 0);
    const nextLength = currentLength + tag.length + (acc.length > 0 ? 1 : 0);

    if (nextLength > maxCharacters) return acc;
    acc.push(tag);
    return acc;
  }, []);
};
