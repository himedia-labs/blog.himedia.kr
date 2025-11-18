'use client';

import { SlArrowUp } from 'react-icons/sl';

import { useScroll } from '../../hooks/useScroll';
import styles from './ScrollTopButton.module.css';

export default function ScrollTopButton() {
  const isVisible = useScroll();

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`${styles.scrollButton} ${isVisible ? styles.visible : ''}`}
      onClick={handleClick}
      aria-label="상단으로 이동"
    >
      <SlArrowUp aria-hidden />
    </button>
  );
}
