import { useEffect, useRef, useState } from 'react';

import { DEFAULT_SPLIT_LEFT, SPLIT_MAX, SPLIT_MIN } from '@/app/shared/constants/config/post.config';

import type { PointerEvent as ReactPointerEvent } from 'react';
import type { SplitViewOptions } from '@/app/shared/types/post';

/**
 * 분할 뷰 훅
 * @description 에디터/프리뷰 분할선 드래그를 관리
 */
export const useSplitView = (options: SplitViewOptions = {}) => {
  const { defaultValue = DEFAULT_SPLIT_LEFT, min = SPLIT_MIN, max = SPLIT_MAX } = options;
  const splitRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const [splitLeft, setSplitLeft] = useState(defaultValue);

  // 분할 비율 CSS 변수 동기화
  useEffect(() => {
    const container = splitRef.current;
    if (!container) return;
    container.style.setProperty('--split-left', `${splitLeft}%`);
  }, [splitLeft]);

  // 분할 위치 업데이트
  const updateSplit = (clientX: number) => {
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nextValue = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(max, Math.max(min, nextValue));
    setSplitLeft(clamped);
  };

  // 분할 드래그 시작
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSplit(event.clientX);
  };

  // 분할 드래그 이동
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    event.preventDefault();
    updateSplit(event.clientX);
  };

  // 분할 드래그 종료
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    refs: {
      splitRef,
    },
    split: {
      value: splitLeft,
      min,
      max,
      handlers: {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
      },
    },
  };
};
