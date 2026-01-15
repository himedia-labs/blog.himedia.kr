import { Fragment, type ReactNode } from 'react';

import Image from 'next/image';

import type { DraftData, InlinePattern, PostDetailResponse } from '@/app/shared/types/post';

const MARKDOWN_INLINE_PATTERNS: InlinePattern[] = [
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
// 태그 입력 토큰 분리
export const extractTags = (input: string) =>
  input
    .split(/[,\s]+/)
    .map(tag => tag.replace(/^#+/, '').trim())
    .filter(Boolean);

// 태그 추천 검색어 추출
export const getTagQueryFromInput = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  return (
    trimmed
      .replace(/^#+/, '')
      .split(/[,\s]+/)
      .filter(Boolean)
      .pop() ?? ''
  );
};

// 미리보기 날짜 생성
export const formatDateLabel = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '.');

// 링크 주소를 외부 링크 형식으로 보정
const normalizeHref = (href: string) => {
  if (!href) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  if (href.startsWith('#') || href.startsWith('/')) return href;
  return `https://${href}`;
};

// 자동 링크 뒤에 붙은 문장부호 분리
const splitTrailingPunctuation = (value: string) => {
  let href = value;
  let trailing = '';
  while (/[),.!?:;]$/.test(href)) {
    trailing = href.slice(-1) + trailing;
    href = href.slice(0, -1);
  }
  return { href, trailing };
};

// 인라인 마크다운을 React 노드로 변환
const parseInline = (text: string) => {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let bestMatch: RegExpExecArray | null = null;
    let bestPattern: InlinePattern | null = null;

    for (const pattern of MARKDOWN_INLINE_PATTERNS) {
      const match = pattern.regex.exec(remaining);
      if (!match) continue;
      if (!bestMatch || match.index < bestMatch.index) {
        bestMatch = match;
        bestPattern = pattern;
      }
    }

    if (!bestMatch || !bestPattern) {
      nodes.push(remaining);
      break;
    }

    if (bestMatch.index > 0) {
      nodes.push(remaining.slice(0, bestMatch.index));
      remaining = remaining.slice(bestMatch.index);
      continue;
    }

    const [full, ...groups] = bestMatch;
    const nodeKey = `inline-${key}`;

    switch (bestPattern.type) {
      case 'code':
        nodes.push(<code key={nodeKey}>{groups[0]}</code>);
        break;
      case 'image':
        nodes.push(
          <Image
            key={nodeKey}
            src={groups[1]}
            alt={groups[0]}
            width={0}
            height={0}
            sizes="100vw"
            unoptimized
            style={{ width: '100%', height: 'auto' }}
          />,
        );
        break;
      case 'link':
        nodes.push(
          <a key={nodeKey} href={normalizeHref(groups[1])}>
            {groups[0]}
          </a>,
        );
        break;
      case 'autolink': {
        const { href, trailing } = splitTrailingPunctuation(full);
        nodes.push(
          <a key={nodeKey} href={normalizeHref(href)}>
            {href}
          </a>,
        );
        if (trailing) nodes.push(trailing);
        break;
      }
      case 'bold':
        nodes.push(<strong key={nodeKey}>{groups[0]}</strong>);
        break;
      case 'strike':
        nodes.push(<del key={nodeKey}>{groups[0]}</del>);
        break;
      case 'underline':
        nodes.push(<u key={nodeKey}>{groups[0]}</u>);
        break;
      case 'italic':
        nodes.push(<em key={nodeKey}>{groups[0]}</em>);
        break;
    }

    remaining = remaining.slice(full.length);
    key += 1;
  }

  return nodes;
};

// 여러 줄 인라인 텍스트 렌더링
const renderInlineLines = (lines: string[]) => {
  return lines.map((line, index) => (
    <Fragment key={`line-${index}`}>
      {parseInline(line)}
      {index < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
};

// 마크다운 본문을 프리뷰 노드로 변환
export const renderMarkdownPreview = (value: string): ReactNode[] => {
  const lines = value.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  const isBlank = (line: string) => line.trim() === '';
  const isFence = (line: string) => line.trim().startsWith('```');
  const isHorizontalRule = (line: string) => /^-{3,}$/.test(line.trim());
  const isHeading = (line: string) => /^#{1,3}\s+/.test(line);
  const isQuote = (line: string) => line.startsWith('> ');
  const isBullet = (line: string) => line.startsWith('- ');
  const isNumbered = (line: string) => /^\d+\.\s+/.test(line);

  while (index < lines.length) {
    const line = lines[index];

    if (isBlank(line)) {
      index += 1;
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    if (isFence(line)) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && isFence(lines[index])) index += 1;
      blocks.push(
        <pre key={`code-${index}`}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (isHeading(line)) {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      const level = match?.[1].length ?? 1;
      const text = match?.[2] ?? '';
      if (level === 1) {
        blocks.push(<h1 key={`h1-${index}`}>{parseInline(text)}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={`h2-${index}`}>{parseInline(text)}</h2>);
      } else {
        blocks.push(<h3 key={`h3-${index}`}>{parseInline(text)}</h3>);
      }
      index += 1;
      continue;
    }

    if (isQuote(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && isQuote(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`}>{renderInlineLines(quoteLines)}</blockquote>);
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (index < lines.length && isBullet(lines[index])) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`ul-item-${itemIndex}`}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];
      while (index < lines.length && isNumbered(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`ol-item-${itemIndex}`}>{parseInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      !isBlank(lines[index]) &&
      !isFence(lines[index]) &&
      !isHeading(lines[index]) &&
      !isQuote(lines[index]) &&
      !isBullet(lines[index]) &&
      !isNumbered(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInlineLines(paragraphLines)}</p>);
  }

  return blocks;
};

// draft 상세 데이터 -> 폼 데이터 변환
export const mapDraftToForm = (draft: PostDetailResponse): DraftData => ({
  title: draft.title ?? '',
  categoryId: draft.category?.id ?? '',
  thumbnailUrl: draft.thumbnailUrl ?? '',
  content: draft.content ?? '',
  tags: draft.tags?.map(tag => tag.name) ?? [],
});
