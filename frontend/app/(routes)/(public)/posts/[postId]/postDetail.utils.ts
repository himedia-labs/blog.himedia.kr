import type { UserRole } from '@/app/shared/types/post';

const mentionBoundaryPattern = /[\s.,!?(){}\[\]<>/\\'"`~:;]/;

const isMentionBoundary = (value: string, index: number) => {
  if (index < 0 || index >= value.length) return true;
  return mentionBoundaryPattern.test(value[index]);
};

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
