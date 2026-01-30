/**
 * 태그 입력 토큰 분리
 * @description 입력 문자열에서 태그 후보를 추출
 */
export const extractTags = (input: string) =>
  input
    .split(/[,\s]+/)
    .map(tag => tag.replace(/^#+/, '').trim())
    .filter(Boolean);
