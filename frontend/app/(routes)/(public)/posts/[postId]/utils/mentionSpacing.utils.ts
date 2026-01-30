// 멘션 패턴
const mentionPattern = /@[A-Za-z0-9_가-힣]+/g;

/**
 * 멘션 공백 보정
 * @description 완성된 멘션 뒤 공백을 보정
 */
export const ensureMentionSpacing = (value: string, allowList: Set<string>, caretIndex: number) => {
  const normalizedValue = value.replace(/\u00a0/g, ' ');
  let lastIndex = 0;
  let caretOffset = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(normalizedValue)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const nextChar = normalizedValue[endIndex] ?? '';

    result += normalizedValue.slice(lastIndex, endIndex);

    if (allowList.has(match[0]) && (nextChar === '' || !/\s/.test(nextChar))) {
      result += ' ';
      if (endIndex < caretIndex) {
        caretOffset += 1;
      }
    }

    lastIndex = endIndex;
  }

  result += normalizedValue.slice(lastIndex);

  return { value: result, caretIndex: caretIndex + caretOffset };
};
