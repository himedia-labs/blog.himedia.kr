export const POST_VALIDATION_MESSAGES = {
  TITLE_REQUIRED: '제목을 입력해주세요.',
  TITLE_STRING: '제목은 문자열이어야 합니다.',
  TITLE_MAX_LENGTH: '제목은 200자 이하여야 합니다.',
  CONTENT_REQUIRED: '내용을 입력해주세요.',
  CONTENT_STRING: '내용은 문자열이어야 합니다.',
  CATEGORY_REQUIRED: '카테고리를 선택해주세요.',
  CATEGORY_ID_STRING: '카테고리 ID는 문자열이어야 합니다.',
  AUTHOR_ID_STRING: '작성자 ID는 문자열이어야 합니다.',
  POST_STATUS_ENUM: '유효한 게시 상태를 선택해주세요.',
  THUMBNAIL_URL_STRING: '썸네일 URL은 문자열이어야 합니다.',
  THUMBNAIL_URL_MAX_LENGTH: '썸네일 URL은 500자 이하여야 합니다.',
  TAGS_ARRAY: '태그는 배열이어야 합니다.',
  TAGS_MAX_COUNT: '태그는 최대 5개까지 입력할 수 있습니다.',
  TAG_STRING: '태그는 문자열이어야 합니다.',
  TAG_MAX_LENGTH: '태그는 20자 이하여야 합니다.',
  PAGE_NUMBER: '페이지는 숫자여야 합니다.',
  PAGE_MIN: '페이지는 1 이상이어야 합니다.',
  LIMIT_NUMBER: 'limit은 숫자여야 합니다.',
  LIMIT_MIN: 'limit은 1 이상이어야 합니다.',
  LIMIT_MAX: 'limit은 50 이하여야 합니다.',
  POST_SORT_ENUM: '유효한 정렬 기준을 선택해주세요.',
  POST_FEED_ENUM: '유효한 피드 기준을 선택해주세요.',
  SORT_ORDER_ENUM: '유효한 정렬 방향을 선택해주세요.',
} as const;

export const POST_ERROR_MESSAGES = {
  POST_NOT_FOUND: '게시글을 찾을 수 없습니다.',
} as const;
