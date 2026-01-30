/**
 * 답글 입력 높이 조정
 * @description 답글 입력 높이를 content에 맞게 조정
 */
export const resizeReplyInput = (element: HTMLDivElement | null) => {
  if (!element) return;
  element.style.height = '40px';
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
};
