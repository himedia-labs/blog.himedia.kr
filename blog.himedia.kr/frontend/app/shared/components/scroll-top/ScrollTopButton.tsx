'use client';

import { usePathname } from 'next/navigation';
import { SlArrowUp } from 'react-icons/sl';

import { useScroll } from '../../hooks/useScroll';
import styles from './ScrollTopButton.module.css';

export default function ScrollTopButton() {
  const isVisible = useScroll();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const positionClass = isHome ? styles.homePosition : styles.innerPosition;

  return (
    <button
      type="button"
      className={`${styles.scrollButton} ${positionClass} ${isVisible ? styles.visible : ''}`}
      onClick={handleClick}
      aria-label="상단으로 이동"
    >
      <SlArrowUp aria-hidden />
    </button>
  );
}
