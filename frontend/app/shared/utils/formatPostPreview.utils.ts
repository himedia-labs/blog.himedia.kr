import { stripInlineMarkdown } from '@/app/shared/utils/markdown/helpers';

type FormatPostPreviewOptions = {
  emptyText?: string;
};

/**
 * 포스트 미리보기 텍스트 정리
 * @description 마크다운/HTML 문법을 제거하고 단일 텍스트로 변환
 */
export const formatPostPreview = (value?: string | null, options?: FormatPostPreviewOptions) => {
  const emptyText = options?.emptyText ?? '';
  if (!value) return emptyText;

  const trimmed = value.trim();
  if (!trimmed) return emptyText;

  const withoutCodeBlocks = trimmed
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/(```|~~~)[^\n]*\n?/g, ' ');
  const withoutHtml = withoutCodeBlocks.replace(/<[^>]+>/g, ' ');
  const plainText = withoutHtml
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line =>
      line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^>\s?/, '')
        .replace(/^[-*+]\s+/, '')
        .replace(/^\d+\.\s+/, ''),
    )
    .map(line => stripInlineMarkdown(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText || emptyText;
};
