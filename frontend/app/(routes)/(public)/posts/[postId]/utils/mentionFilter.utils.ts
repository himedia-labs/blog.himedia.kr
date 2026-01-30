/**
 * 멘션 후보 필터링
 * @description 입력된 검색어에 맞는 사용자만 반환
 */
export const filterMentionCandidates = (candidates: string[], query: string | null) => {
  if (query === null) return [];
  if (!query) return candidates;
  const normalized = query.toLowerCase();
  return candidates.filter(name => name.toLowerCase().includes(normalized));
};

/**
 * 멘션 강조 분리
 * @description 검색어에 해당하는 구간을 분리
 */
export const getMentionHighlightSegments = (name: string, query: string | null) => {
  if (!query) return [{ type: 'text', value: name }] as const;
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const matchIndex = normalizedName.indexOf(normalizedQuery);
  if (matchIndex === -1) return [{ type: 'text', value: name }] as const;

  const matchEnd = matchIndex + query.length;
  return [
    { type: 'text', value: name.slice(0, matchIndex) },
    { type: 'match', value: name.slice(matchIndex, matchEnd) },
    { type: 'text', value: name.slice(matchEnd) },
  ] as const;
};
