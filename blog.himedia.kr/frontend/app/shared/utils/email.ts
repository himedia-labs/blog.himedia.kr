// 이메일 입력에서 한글/공백 등 허용되지 않는 문자를 제거
export default function sanitizeEmailInput(value: string) {
  return value.replace(/[^a-zA-Z0-9@._+-]/g, '');
}
