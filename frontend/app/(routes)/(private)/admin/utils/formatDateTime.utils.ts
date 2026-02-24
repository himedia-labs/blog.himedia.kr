/**
 * 날짜 시간 포맷
 * @description 로컬 기준 yyyy.mm.dd hh:mm:ss 형태 문자열로 반환
 */
export const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};
