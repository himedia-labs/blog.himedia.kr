import { createHeadingIdFactory, stripInlineMarkdown } from '@/app/shared/utils/markdown/helpers';

import type { PostTocItem } from '@/app/shared/types/post';

/**
 * 마크다운 목차 추출
 * @description H1~H3 제목 목록을 생성
 */
export const extractMarkdownHeadings = (value: string): PostTocItem[] => {
  const lines = value.split('\n');
  const headings: PostTocItem[] = [];
  const getHeadingId = createHeadingIdFactory();

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
    const rawText = match[2] ?? '';
    const cleanText = stripInlineMarkdown(rawText);
    const displayText = cleanText || `섹션 ${headings.length + 1}`;

    headings.push({
      id: getHeadingId(cleanText),
      level,
      text: displayText,
    });
  }

  return headings;
};
