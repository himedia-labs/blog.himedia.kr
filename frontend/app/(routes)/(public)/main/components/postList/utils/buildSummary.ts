/**
 * 요약 생성
 * @description 마크다운/HTML 제거 후 요약 텍스트 생성
 */
export const buildSummary = (content?: string) => {
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
  return plainText.length > 154 ? `${plainText.slice(0, 134)}...` : plainText;
};
