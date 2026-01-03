import Image from 'next/image';

import styles from './banner.module.css';

export default function Banner() {
  return (
    <section className={styles.banner} aria-label="하이미디어 배너">
      <Image
        src="/banner1.png"
        alt="Banner"
        width={1200}
        height={303}
        priority
        draggable={false}
        className={styles.bannerImage}
      />
    </section>
  );
}
