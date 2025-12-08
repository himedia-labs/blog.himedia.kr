import Image from 'next/image';

import styles from './banner.module.css';

export default function Banner() {
  return (
    <section className={styles.banner} aria-label="하이미디어 배너">
      <Image
        src="/banner.png"
        alt="Banner"
        width={3000}
        height={500}
        priority
        draggable={false}
        className={styles.bannerImage}
      />
    </section>
  );
}
