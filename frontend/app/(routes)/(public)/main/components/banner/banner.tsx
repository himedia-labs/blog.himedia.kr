import Image from 'next/image';
import { FaReact } from 'react-icons/fa';

import styles from '@/app/(routes)/(public)/main/components/banner/banner.module.css';

/**
 * 메인 배너
 * @description 배너 이미지와 데코 아이콘을 렌더링
 */
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
