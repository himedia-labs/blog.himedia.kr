/**
 * 커서 인덱스 계산
 * @description contenteditable 커서 위치 계산
 */
export const getCaretIndex = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return element.innerText.length;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.endContainer)) return element.innerText.length;

  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
};

/**
 * 커서 위치 이동
 * @description contenteditable 커서를 지정 위치로 이동
 */
export const setCaretIndex = (element: HTMLElement, index: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentIndex = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length ?? 0;
    const nextIndex = currentIndex + nodeLength;
    if (index <= nextIndex) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, index - currentIndex));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentIndex = nextIndex;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};
