import Skeleton from 'react-loading-skeleton';

import styles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

type CardSkeletonVariant = {
  hasTags: boolean;
  hasThumbnail: boolean;
};

type CardPostSkeletonItemProps = {
  index: number;
  skeletonKeyPrefix: string;
  variant: CardSkeletonVariant;
  cardTagSkeletonWidths: number[];
};

/**
 * 카드 포스트 스켈레톤 아이템
 * @description 카드 분기(썸네일/태그 유무)와 동일한 구조로 표시
 */
export default function CardPostSkeletonItem({
  index,
  variant,
  skeletonKeyPrefix,
  cardTagSkeletonWidths,
}: CardPostSkeletonItemProps) {
  // 상태 계산
  const hasThumbnail = variant.hasThumbnail;
  const hasCardTags = variant.hasTags;
  const noThumbNoTag = !hasThumbnail && !hasCardTags;
  const summaryLineCount = hasThumbnail && hasCardTags ? 4 : hasThumbnail ? 6 : hasCardTags ? 15 : 16;

  // 클래스 계산
  const cardItemClassName = noThumbNoTag ? `${styles.cardItem} ${styles.cardItemNoThumbNoTags}` : styles.cardItem;
  const cardBodyClassName = hasThumbnail
    ? styles.cardBody
    : `${styles.cardBody} ${styles.cardBodyNoThumb} ${hasCardTags ? styles.cardBodyNoThumbWithTags : ''} ${
        noThumbNoTag ? styles.cardBodyNoThumbNoTags : ''
      }`;
  const cardTextClassName = hasThumbnail ? `${styles.cardText} ${styles.cardTextWithThumb}` : styles.cardText;
  const cardTagListClassName = hasThumbnail ? `${styles.cardTagList} ${styles.cardTagListWithThumb}` : styles.cardTagList;
  const summarySkeletonLines = Array.from({ length: summaryLineCount });

  return (
    <li>
      <article className={cardItemClassName} aria-hidden="true">
        <div className={styles.cardTop}>
          {hasThumbnail ? (
            <div className={styles.cardThumb}>
              <Skeleton width="100%" height="100%" />
            </div>
          ) : null}
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
        {hasCardTags ? (
          <ul className={cardTagListClassName} aria-hidden="true">
            {cardTagSkeletonWidths.map(width => (
              <li key={`${skeletonKeyPrefix}-tag-${index}-${width}`} className={styles.cardTagItem}>
                <Skeleton height={12} width={width} />
              </li>
            ))}
          </ul>
        ) : null}
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
