/**
 * 첫 이미지 링크 추출
 * @description 본문에서 HTML/마크다운 이미지 URL을 찾음
 */
export const extractImageUrl = (content?: string) => {
  if (!content) return undefined;
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  const markdownMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownMatch?.[1]) return markdownMatch[1];
  return undefined;
};
