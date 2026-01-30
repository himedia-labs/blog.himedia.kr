import type { MouseEvent } from 'react';

/**
 * 목차 클릭 핸들러
 * @description 본문 목차 클릭 시 스크롤을 이동
 */
export const createTocClickHandler = () => (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
};
