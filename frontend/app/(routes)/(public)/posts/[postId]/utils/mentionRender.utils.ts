// 멘션 구분 패턴
const mentionPattern = /@[A-Za-z0-9_가-힣]+/g;
const mentionBoundaryPattern = /[\s.,!?(){}\[\]<>/\\'"`~:;]/;

// 경계 확인
const isMentionBoundary = (value: string, index: number) => {
  if (index < 0 || index >= value.length) return true;
  return mentionBoundaryPattern.test(value[index]);
};

// HTML 이스케이프
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, match => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return escapeMap[match] ?? match;
  });

/**
 * 댓글 태그 분리
 * @description @멘션 텍스트를 분리해 렌더링 정보로 변환
 */
export const splitCommentMentions = (value: string) => {
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  let lastIndex = 0;

  for (const match of value.matchAll(mentionPattern)) {
    const startIndex = match.index ?? 0;
    const endIndex = startIndex + match[0].length;

    if (!isMentionBoundary(value, startIndex - 1) || !isMentionBoundary(value, endIndex)) {
      continue;
    }

    if (startIndex > lastIndex) {
      parts.push({ type: 'text', value: value.slice(lastIndex, startIndex) });
    }

    parts.push({ type: 'mention', value: match[0] });
    lastIndex = endIndex;
  }

  if (lastIndex < value.length) {
    parts.push({ type: 'text', value: value.slice(lastIndex) });
  }

  return parts;
};

/**
 * 멘션 HTML 변환
 * @description 멘션 강조용 HTML을 생성
 */
export const renderMentionHtml = (
  value: string,
  mentionClass: string,
  allowList?: Set<string>,
  preserveSpaces = false,
) =>
  splitCommentMentions(value)
    .map(part => {
      const escaped = escapeHtml(part.value).replace(/\n/g, '<br>');
      const normalized = preserveSpaces ? escaped.replace(/ /g, '&nbsp;') : escaped;

      if (part.type === 'mention') {
        if (!allowList || allowList.has(part.value)) {
          return `<span class="${mentionClass}">${normalized}</span>`;
        }
        return normalized;
      }

      return normalized;
    })
    .join('');
