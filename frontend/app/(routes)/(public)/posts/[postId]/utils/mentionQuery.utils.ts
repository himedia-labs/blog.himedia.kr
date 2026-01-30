// 멘션 검색 패턴
const mentionQueryPattern = /(?:^|\s)@([A-Za-z0-9_가-힣]*)$/;

/**
 * 멘션 검색어 추출
 * @description 커서 기준으로 @검색어를 추출
 */
export const getMentionQuery = (value: string, caretIndex: number) => {
  const slice = value.slice(0, caretIndex).replace(/\u00a0/g, ' ');
  const match = slice.match(mentionQueryPattern);
  if (!match) return null;
  return match[1] ?? '';
};

/**
 * 멘션 시작 위치
 * @description 커서 기준으로 @ 위치를 찾음
 */
export const getMentionStartIndex = (value: string, caretIndex: number) => {
  const slice = value.slice(0, caretIndex).replace(/\u00a0/g, ' ');
  const match = slice.match(mentionQueryPattern);
  if (!match) return null;
  return slice.lastIndexOf('@');
};
