import type { ReactNode } from 'react';

import { createHeadingIdFactory, stripInlineMarkdown } from '@/app/shared/utils/markdown/helpers';
import { parseInline, renderInlineLines } from '@/app/shared/utils/markdown/inline-parser';

/**
 * 마크다운 프리뷰 변환
 * @description 문자열을 미리보기용 요소로 변환
 */
export const renderMarkdownPreview = (value: string): ReactNode[] => {
  const lines = value.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  const getHeadingId = createHeadingIdFactory();

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
      const headingText = stripInlineMarkdown(text);
      const headingId = getHeadingId(headingText);
      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${index}`} id={headingId}>
            {parseInline(text)}
          </h1>,
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={`h2-${index}`} id={headingId}>
            {parseInline(text)}
          </h2>,
        );
      } else {
        blocks.push(
          <h3 key={`h3-${index}`} id={headingId}>
            {parseInline(text)}
          </h3>,
        );
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
        items.push(lines[index].replace(/^- /, ''));
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
