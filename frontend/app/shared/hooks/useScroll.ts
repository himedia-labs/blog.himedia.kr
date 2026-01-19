'use client';

import { useEffect, useState } from 'react';

/**
 * 스크롤 상태 훅
 * @description 기준값을 넘는 스크롤 여부를 반환
 */
export function useScroll(threshold = 0) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return isScrolled;
}
