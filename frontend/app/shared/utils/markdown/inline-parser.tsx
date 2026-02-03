import { Fragment, type ReactNode } from 'react';

import Image from 'next/image';

import { MARKDOWN_INLINE_PATTERNS } from '@/app/shared/utils/markdown/constants';
import { normalizeHref, splitTrailingPunctuation } from '@/app/shared/utils/markdown/helpers';

import type { InlinePattern } from '@/app/shared/types/post';

/**
 * 인라인 마크다운 파싱
 * @description 인라인 요소를 React 노드로 변환
 */
export const parseInline = (text: string) => {
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

/**
 * 여러 줄 인라인 텍스트 렌더링
 * @description 줄 단위로 인라인 파싱 후 br 삽입
 */
export const renderInlineLines = (lines: string[]) => {
  return lines.map((line, index) => (
    <Fragment key={`line-${index}`}>
      {parseInline(line)}
      {index < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
};
