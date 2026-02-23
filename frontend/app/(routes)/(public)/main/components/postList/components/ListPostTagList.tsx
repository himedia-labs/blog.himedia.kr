'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

import type { ListPostTagListProps } from '@/app/shared/types/post';

/**
 * 태그 너비 측정
 * @description 태그 텍스트를 측정 노드에 넣어 실제 렌더링 너비를 계산
 */
function measureTagWidth(measureNode: HTMLLIElement, tagText: string) {
  measureNode.textContent = tagText;
  return Math.ceil(measureNode.getBoundingClientRect().width);
}

/**
 * 리스트 태그 표시
 * @description 컨테이너 실제 너비 기준으로 보이는 태그와 +N을 렌더링
 */
export default function ListPostTagList({ tags, postId }: ListPostTagListProps) {
  // 측정 상태
  const [visibleCount, setVisibleCount] = useState(tags.length);
  const listRef = useRef<HTMLUListElement | null>(null);
  const measureRef = useRef<HTMLLIElement | null>(null);

  // 표시 개수 계산
  const calculateVisibleCount = useCallback(() => {
    const listNode = listRef.current;
    const measureNode = measureRef.current;
    if (!listNode || !measureNode) return tags.length;

    const containerWidth = listNode.clientWidth;
    if (containerWidth === 0) return tags.length;

    const listStyle = getComputedStyle(listNode);
    const gap = parseFloat(listStyle.columnGap || listStyle.gap || '0');
    const tagWidths = tags.map(tag => measureTagWidth(measureNode, tag));

    for (let count = tags.length; count >= 0; count -= 1) {
      const nextHiddenCount = tags.length - count;
      const visibleWidth = tagWidths.slice(0, count).reduce((sum, width) => sum + width, 0);
      const visibleGap = count > 1 ? gap * (count - 1) : 0;
      const hiddenWidth = nextHiddenCount > 0 ? measureTagWidth(measureNode, `+${nextHiddenCount}`) : 0;
      const hiddenGap = nextHiddenCount > 0 && count > 0 ? gap : 0;
      const totalWidth = visibleWidth + visibleGap + hiddenWidth + hiddenGap;

      if (totalWidth <= containerWidth) {
        return count;
      }
    }

    return 0;
  }, [tags]);

  // 크기 감지
  useEffect(() => {
    const listNode = listRef.current;
    if (!listNode) return;

    const handleResize = () => {
      const count = calculateVisibleCount();
      setVisibleCount(count);
    };

    const observer = new ResizeObserver(handleResize);

    handleResize();
    observer.observe(listNode);

    return () => observer.disconnect();
  }, [calculateVisibleCount]);

  // 표시 데이터
  const hiddenCount = Math.max(tags.length - visibleCount, 0);
  const visibleTags = useMemo(() => tags.slice(0, visibleCount), [tags, visibleCount]);

  return (
    <ul ref={listRef} className={styles.listTagList} aria-label="태그 목록">
      {visibleTags.map((tag, index) => (
        <li key={`${postId}-list-${index}-${tag}`} className={styles.listTagItem}>
          {tag}
        </li>
      ))}
      {hiddenCount > 0 ? <li className={styles.listTagItem}>+{hiddenCount}</li> : null}
      <li
        ref={measureRef}
        className={styles.listTagItem}
        aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      />
    </ul>
  );
}
