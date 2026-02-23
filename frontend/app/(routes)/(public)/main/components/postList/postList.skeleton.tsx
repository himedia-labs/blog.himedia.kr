import Skeleton from 'react-loading-skeleton';

import styles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

type CardPostSkeletonItemProps = {
  index: number;
  skeletonKeyPrefix: string;
  cardTagSkeletonWidths: number[];
};

/**
 * 카드 포스트 스켈레톤 아이템
 * @description 카드 분기(썸네일/태그 유무)와 동일한 구조로 표시
 */
export default function CardPostSkeletonItem({
  index,
  skeletonKeyPrefix,
  cardTagSkeletonWidths,
}: CardPostSkeletonItemProps) {
  // 상태 계산
  const summaryLineCount = 4;

  // 클래스 계산
  const cardItemClassName = styles.cardItem;
  const cardBodyClassName = styles.cardBody;
  const cardTextClassName = `${styles.cardText} ${styles.cardTextWithThumb}`;
  const cardTagListClassName = `${styles.cardTagList} ${styles.cardTagListWithThumb}`;
  const summarySkeletonLines = Array.from({ length: summaryLineCount });

  return (
    <li>
      <article className={cardItemClassName} aria-hidden="true">
        <div className={styles.cardTop}>
          <div className={styles.cardThumb}>
            <Skeleton width="100%" height="100%" />
          </div>
          <div className={cardBodyClassName}>
            <div className={cardTextClassName}>
              <Skeleton height={18} width="50%" />
              <div className={`${styles.skeletonSummary} ${styles.cardSkeletonSummary}`}>
                {summarySkeletonLines.map((_, lineIndex) => (
                  <Skeleton key={`${skeletonKeyPrefix}-summary-${index}-${lineIndex}`} height={14} width="100%" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <ul className={cardTagListClassName} aria-hidden="true">
          {cardTagSkeletonWidths.map(width => (
            <li key={`${skeletonKeyPrefix}-tag-${index}-${width}`} className={styles.cardTagItem}>
              <Skeleton height={12} width={width} />
            </li>
          ))}
        </ul>
        <div className={`${styles.cardFooter} ${styles.cardFooterWithThumb}`}>
          <div className={styles.cardDateRow}>
            <Skeleton width={140} height={12} />
          </div>
          <div className={styles.cardFooterDivider} aria-hidden="true" />
          <div className={styles.cardMetaRow}>
            <div className={styles.cardAuthor}>
              <Skeleton circle width={24} height={24} />
              <Skeleton width={80} height={12} />
            </div>
            <div className={styles.cardStats}>
              <Skeleton width={36} height={12} />
              <Skeleton width={36} height={12} />
              <Skeleton width={36} height={12} />
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}
