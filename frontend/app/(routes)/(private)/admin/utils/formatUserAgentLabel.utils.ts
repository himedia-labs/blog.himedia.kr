/**
 * 브라우저 라벨 포맷
 * @description User-Agent를 최대 길이로 잘라 표시 문자열로 반환
 */
export const formatUserAgentLabel = (value: string | null | undefined) => {
  if (!value || value === 'N/A') return 'N/A';
  if (value.length <= 48) return value;
  return `${value.slice(0, 48)}...`;
};
