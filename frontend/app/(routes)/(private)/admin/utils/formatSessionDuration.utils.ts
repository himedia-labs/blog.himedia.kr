/**
 * 세션 시간 포맷
 * @description 초 단위를 h m s 형태 문자열로 변환
 */
export const formatSessionDuration = (seconds: number | null) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds < 0) return '진행중';
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = Math.floor(seconds % 60);
  if (hour > 0) return `${hour}시간 ${minute}분 ${second}초`;
  if (minute > 0) return `${minute}분 ${second}초`;
  return `${second}초`;
};
