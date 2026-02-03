import type { InlinePattern } from '@/app/shared/types/post';

/**
 * 마크다운 인라인 패턴
 * @description 인라인 요소 파싱 규칙
 */
export const MARKDOWN_INLINE_PATTERNS: InlinePattern[] = [
  { type: 'code', regex: /`([^`]+?)`/ },
  { type: 'image', regex: /!\[([^\]]*)\]\(([^)]+)\)/ },
  { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/ },
  { type: 'autolink', regex: /https?:\/\/[^\s<]+/ },
  { type: 'bold', regex: /\*\*([^*]+?)\*\*/ },
  { type: 'strike', regex: /~~([^~]+?)~~/ },
  { type: 'underline', regex: /<u>(.*?)<\/u>/ },
  { type: 'italic', regex: /_([^_]+?)_/ },
  { type: 'italic', regex: /\*([^*]+?)\*/ },
];
