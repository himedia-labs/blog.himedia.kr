import type { MouseEvent } from 'react';

/**
 * 메뉴 이벤트 차단
 * @description 드롭다운 클릭 이벤트 전파를 차단
 */
export const stopMenuPropagation = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};
