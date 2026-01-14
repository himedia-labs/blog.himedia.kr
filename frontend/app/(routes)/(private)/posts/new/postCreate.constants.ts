// 제목 입력 최대 글자 수
export const TITLE_MAX_LENGTH = 50;
// 태그 최대 개수
export const TAG_MAX_COUNT = 5;
// 태그 한 개당 최대 글자 수
export const TAG_MAX_LENGTH = 20;
// 이미지 업로드 최대 용량(byte)
export const THUMBNAIL_MAX_SIZE = 10 * 1024 * 1024;
// 임시저장 토스트 노출 시간(ms)
export const DRAFT_TOAST_DURATION_MS = 5000;
// 자동 임시저장 대기 시간(ms)
export const AUTO_SAVE_DELAY_MS = 10000;
// 분할 기본 비율(좌측 %)
export const DEFAULT_SPLIT_LEFT = 50;
// 분할 최소 비율(좌측 %)
export const SPLIT_MIN = 35;
// 분할 최대 비율(좌측 %)
export const SPLIT_MAX = 65;

// UI 기본값
export const DEFAULT_CATEGORY_LABEL = '카테고리';
export const DEFAULT_AUTHOR_NAME = '홍길동';
export const DEFAULT_PREVIEW_STATS = {
  views: 128,
  likeCount: 12,
  commentCount: 3,
};

// 토스트 메시지
export const TOAST_DRAFT_SAVED_MESSAGE = '임시저장 완료';
export const TOAST_TITLE_REQUIRED_MESSAGE = '제목을 입력해주세요.';
export const TOAST_CATEGORY_REQUIRED_MESSAGE = '카테고리를 선택해주세요.';
export const TOAST_CONTENT_REQUIRED_MESSAGE = '본문을 입력해주세요.';
export const TOAST_SAVE_SUCCESS_MESSAGE = '게시물이 저장되었습니다.';
export const TOAST_SAVE_FAILURE_MESSAGE = '게시물 저장에 실패했습니다.';
export const TOAST_THUMBNAIL_UPLOAD_SUCCESS_MESSAGE = '썸네일 업로드 완료';
export const TOAST_THUMBNAIL_UPLOAD_FAILURE_MESSAGE = '썸네일 업로드에 실패했습니다.';
export const TOAST_THUMBNAIL_UPLOAD_TYPE_MESSAGE = '이미지 파일만 업로드할 수 있습니다.';
export const TOAST_THUMBNAIL_UPLOAD_SIZE_MESSAGE = '이미지는 10MB 이하로 업로드해주세요.';
export const TOAST_IMAGE_UPLOAD_SUCCESS_MESSAGE = '이미지 업로드 완료';
export const TOAST_IMAGE_UPLOAD_FAILURE_MESSAGE = '이미지 업로드에 실패했습니다.';
export const TOAST_IMAGE_UPLOAD_TYPE_MESSAGE = '이미지 파일만 업로드할 수 있습니다.';
export const TOAST_IMAGE_UPLOAD_SIZE_MESSAGE = '이미지는 10MB 이하로 업로드해주세요.';
