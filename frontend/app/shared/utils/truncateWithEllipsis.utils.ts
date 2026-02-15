/**
 * 말줄임 텍스트 생성
 * @description 지정 길이 초과 시 공백 포함 말줄임( ` ...`)으로 반환
 */
export const truncateWithEllipsis = (value: string, maxLength: number) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const normalized = trimmed.replace(/\s*\.\.\.$/, ' ...');
  if (normalized.length <= maxLength) return normalized;

  const withoutTail = normalized.replace(/\s*\.\.\.$/, '');
  return `${withoutTail.slice(0, maxLength).trimEnd()} ...`;
};
