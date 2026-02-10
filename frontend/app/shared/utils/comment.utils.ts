export const MAX_COMMENT_CONTENT_LENGTH = 1000;

/**
 * 댓글 본문 정규화
 * @description 공백 문자/줄바꿈 형식을 통일하고 연속 줄바꿈을 2줄로 제한
 */
export const normalizeCommentContent = (value: string): string =>
  value.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

/**
 * 댓글 본문 저장값 생성
 * @description 정규화된 댓글 본문을 trim 처리해 저장 가능한 문자열로 변환
 */
export const sanitizeCommentContent = (value: string): string => normalizeCommentContent(value).trim();

/**
 * 댓글 길이 초과 여부
 * @description 정규화 기준 길이가 최대 제한을 초과하는지 반환
 */
export const isCommentContentTooLong = (value: string): boolean =>
  normalizeCommentContent(value).length > MAX_COMMENT_CONTENT_LENGTH;
