export const COMMENT_VALIDATION_MESSAGES = {
  CONTENT_REQUIRED: '내용을 입력해주세요.',
  CONTENT_STRING: '내용은 문자열이어야 합니다.',
  CONTENT_MAX_LENGTH: '댓글은 1000자를 초과할 수 없습니다.',
  PARENT_ID_STRING: '부모 댓글 ID는 문자열이어야 합니다.',
} as const;

export const COMMENT_ERROR_MESSAGES = {
  COMMENT_NOT_FOUND: '댓글을 찾을 수 없습니다.',
  COMMENT_FORBIDDEN: '본인 댓글만 수정/삭제할 수 있습니다.',
} as const;
