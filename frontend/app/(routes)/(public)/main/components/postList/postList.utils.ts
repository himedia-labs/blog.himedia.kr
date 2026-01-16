import type { Post, PostListItem } from '@/app/shared/types/post';

// 날짜 문자열을 화면용 포맷으로 변환
const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 본문에서 첫 이미지 링크 추출
const extractImageUrl = (content?: string) => {
  if (!content) return undefined;
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  const markdownMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownMatch?.[1]) return markdownMatch[1];
  return undefined;
};

// 마크다운/HTML 제거 후 요약 문구 생성
const buildSummary = (content?: string) => {
  if (!content) return '';
  const trimmed = content.trim();
  if (!trimmed) return '';
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
  if (!plainText) return '';
  return plainText.length > 140 ? `${plainText.slice(0, 140)}...` : plainText;
};

// 게시글 업로드 시점 기준 경과 시간 계산
const buildRelativeTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60000) return '방금 전';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(days / 365);
  return `${years}년 전`;
};

// API 응답을 화면용 Post로 변환
export const toViewPost = (item: PostListItem): Post => {
  const imageUrl = item.thumbnailUrl ?? extractImageUrl(item.content);
  return {
    id: item.id,
    title: item.title,
    summary: buildSummary(item.content),
    imageUrl,
    category: item.category?.name ?? 'ALL',
    date: formatDate(item.publishedAt ?? item.createdAt),
    timeAgo: buildRelativeTime(item.publishedAt ?? item.createdAt),
    views: item.viewCount,
    likeCount: item.likeCount,
    commentCount: item.commentCount ?? 0,
  };
};
