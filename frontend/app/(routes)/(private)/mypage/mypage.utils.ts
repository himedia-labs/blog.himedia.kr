import type { PostListItem } from '@/app/shared/types/post';

export type TabKey = 'posts' | 'comments' | 'likes' | 'settings' | 'account';
export type ActivitySortKey = 'latest' | 'popular';

// 탭 판별
export const getInitialTab = (value?: string | null, defaultTab: TabKey = 'posts') => {
  if (value === 'comments' || value === 'likes' || value === 'posts' || value === 'settings' || value === 'account') {
    return value;
  }
  return defaultTab;
};

// 날짜 포맷
export const formatDateLabel = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

// 게시글 정렬
export const sortPostsByKey = (posts: PostListItem[], sortKey: ActivitySortKey) => {
  const list = [...posts];
  if (sortKey === 'popular') {
    return list.sort((a, b) => b.likeCount - a.likeCount || b.viewCount - a.viewCount);
  }
  return list.sort(
    (a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
};

// 요약 생성
export const formatSummary = (value?: string | null) => {
  if (!value) return '내용 없음';
  const trimmed = value.trim();
  if (!trimmed) return '내용 없음';
  const withoutCodeBlocks = trimmed.replace(/```[\s\S]*?```/g, ' ');
  const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, '$1');
  const withoutImages = withoutInlineCode.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  const withoutHtml = withoutLinks.replace(/<[^>]+>/g, ' ');
  const withoutDecorators = withoutHtml
    .replace(/^>\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/(\*\*|__|~~|_)/g, '');
  const plainText = withoutDecorators.replace(/\s+/g, ' ').trim();
  if (!plainText) return '내용 없음';
  return plainText.length > 200 ? `${plainText.slice(0, 185)}...` : plainText;
};

// 날짜/시간 포맷
export const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
