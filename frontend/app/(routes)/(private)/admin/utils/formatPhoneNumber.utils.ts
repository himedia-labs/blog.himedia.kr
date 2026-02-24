/**
 * 전화번호 포맷
 * @description 숫자만 추출해 하이픈 형식으로 반환
 */
export const formatPhoneNumber = (value: string | null | undefined) => {
  if (!value) return '-';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
};
