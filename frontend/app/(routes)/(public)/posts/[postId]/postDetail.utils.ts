import type { UserRole } from '@/app/shared/types/post';

const mentionBoundaryPattern = /[\s.,!?(){}\[\]<>/\\'"`~:;]/;
const mentionQueryPattern = /(?:^|\s)@([A-Za-z0-9_가-힣]*)$/;

const isMentionBoundary = (value: string, index: number) => {
  if (index < 0 || index >= value.length) return true;
  return mentionBoundaryPattern.test(value[index]);
};

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
 * 날짜 포맷
 * @description 게시물 날짜 문자열을 포맷
 */
export const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

/**
 * 날짜 시간 포맷
 * @description 댓글 작성 시간을 표시
 */
export const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

/**
 * 역할 변환
 * @description 사용자 역할을 한글로 변환
 */
export const formatRole = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    TRAINEE: '훈련생',
    GRADUATE: '수료생',
    MENTOR: '멘토',
    INSTRUCTOR: '강사',
    ADMIN: '관리자',
  };
  return roleMap[role] ?? '훈련생';
};

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

/**
 * 댓글 태그 분리
 * @description @멘션 텍스트를 분리해 렌더링 정보로 변환
 */
export const splitCommentMentions = (value: string) => {
  const mentionPattern = /@[A-Za-z0-9_가-힣]+/g;
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
export const renderMentionHtml = (value: string, mentionClass: string, allowList?: Set<string>, preserveSpaces = false) =>
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

/**
 * 멘션 공백 보정
 * @description 완성된 멘션 뒤 공백을 보정
 */
export const ensureMentionSpacing = (value: string, allowList: Set<string>, caretIndex: number) => {
  const mentionPattern = /@[A-Za-z0-9_가-힣]+/g;
  const normalizedValue = value.replace(/\u00a0/g, ' ');
  let lastIndex = 0;
  let caretOffset = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(normalizedValue)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const nextChar = normalizedValue[endIndex] ?? '';

    result += normalizedValue.slice(lastIndex, endIndex);

    if (allowList.has(match[0]) && (nextChar === '' || !/\s/.test(nextChar))) {
      result += ' ';
      if (endIndex < caretIndex) {
        caretOffset += 1;
      }
    }

    lastIndex = endIndex;
  }

  result += normalizedValue.slice(lastIndex);

  return { value: result, caretIndex: caretIndex + caretOffset };
};

/**
 * 커서 인덱스 계산
 * @description contenteditable 커서 위치 계산
 */
export const getCaretIndex = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return element.innerText.length;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.endContainer)) return element.innerText.length;

  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
};

/**
 * 커서 위치 이동
 * @description contenteditable 커서를 지정 위치로 이동
 */
export const setCaretIndex = (element: HTMLElement, index: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentIndex = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length ?? 0;
    const nextIndex = currentIndex + nodeLength;
    if (index <= nextIndex) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, index - currentIndex));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentIndex = nextIndex;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * 답글 입력 높이 조정
 * @description 답글 입력 높이를 content에 맞게 조정
 */
export const resizeReplyInput = (element: HTMLDivElement | null) => {
  if (!element) return;
  element.style.height = '40px';
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
};

/**
 * 클립보드 복사
 * @description 문자열을 클립보드에 복사
 */
export const copyToClipboard = async (value: string) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.readOnly = true;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('COPY_FAILED');
  }
};
