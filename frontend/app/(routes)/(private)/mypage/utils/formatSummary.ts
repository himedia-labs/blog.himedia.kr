/**
 * 요약 생성
 * @description 마크다운/HTML을 제거한 요약 텍스트 생성
 */
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
