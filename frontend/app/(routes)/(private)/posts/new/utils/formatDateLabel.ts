/**
 * 미리보기 날짜 생성
 * @description 미리보기용 날짜 문자열을 생성
 */
export const formatDateLabel = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '.');
