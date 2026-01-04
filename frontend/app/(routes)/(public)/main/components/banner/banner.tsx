import Image from 'next/image';
import { FaReact } from 'react-icons/fa';

import styles from './banner.module.css';

export default function Banner() {
  return (
    <section className={styles.banner} aria-label="하이미디어 배너">
      <div className={styles.bannerInner}>
        <Image
          src="/banner.png"
          alt="Banner"
          width={1200}
          height={300}
          quality={100}
          unoptimized
          priority
          draggable={false}
          className={styles.bannerImage}
        />
        <span className={styles.bannerIcon} aria-hidden="true">
          <FaReact />
        </span>
      </div>
    </section>
  );
}
