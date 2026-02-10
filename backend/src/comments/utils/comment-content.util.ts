export const MAX_COMMENT_CONTENT_LENGTH = 1000;

/**
 * 댓글 내용 정규화
 * @description 공백 문자/줄바꿈 형식을 통일하고 연속 줄바꿈을 2줄로 제한
 */
export const normalizeCommentContent = (value: string): string =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

/**
 * 댓글 내용 저장값 생성
 * @description 정규화된 댓글 내용을 trim 처리해 저장 가능한 문자열로 반환
 */
export const sanitizeCommentContent = (value: string): string => normalizeCommentContent(value).trim();
