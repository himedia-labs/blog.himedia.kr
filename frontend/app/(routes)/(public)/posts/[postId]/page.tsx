'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import Skeleton from 'react-loading-skeleton';
import { FiEye, FiHeart, FiShare2 } from 'react-icons/fi';

import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { formatDate } from './postDetail.utils';
import { usePostDetailActions } from './postDetail.hooks';

import 'react-loading-skeleton/dist/skeleton.css';
import styles from './PostDetail.module.css';

/**
 * 게시물 상세 페이지
 * @description 게시물 상세 내용과 반응 정보를 표시
 */
export default function PostDetailPage() {
  // 라우트 데이터
  const params = useParams();
  const postId = typeof params?.postId === 'string' ? params.postId : '';
  const { data, isLoading, isError } = usePostDetailQuery(postId, { enabled: Boolean(postId) });

  // 파생 데이터
  const shareCount = data?.shareCount ?? 0;
  const thumbnailUrl = data?.thumbnailUrl ?? null;
  const hasThumbnail = Boolean(thumbnailUrl);
  const { handleShareCopy, previewContent } = usePostDetailActions({ data, postId });

  if (isLoading) {
    return (
      <section className={styles.container} aria-label="게시물 상세">
        <aside className={styles.actions} aria-label="게시물 반응">
          <div className={styles.actionsInner}>
            <div className={styles.actionButton} aria-hidden="true">
              <Skeleton circle height={18} width={18} />
              <Skeleton height={10} width={24} />
            </div>
            <div className={styles.actionButton} aria-hidden="true">
              <Skeleton circle height={18} width={18} />
              <Skeleton height={10} width={24} />
            </div>
            <div className={styles.actionButton} aria-hidden="true">
              <Skeleton circle height={18} width={18} />
              <Skeleton height={10} width={24} />
            </div>
          </div>
        </aside>
        <div className={styles.header}>
          <Skeleton width={120} height={12} />
          <Skeleton width="70%" height={42} />
          <Skeleton width={220} height={14} />
        </div>
        <div className={styles.body}>
          <div className={styles.mainContent}>
            <div className={styles.thumbnail}>
              <Skeleton height={700} borderRadius={16} />
            </div>
            <div className={styles.content}>
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton height={16} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className={styles.container} aria-label="게시물 상세">
        <div className={styles.error}>게시물을 불러올 수 없습니다.</div>
        <Link className={styles.backLink} href="/">
          메인으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="게시물 상세">
      <aside className={styles.actions} aria-label="게시물 반응">
        <div className={`${styles.actionsInner} ${hasThumbnail ? '' : styles.actionsNoThumb}`}>
          <button type="button" className={styles.actionButton} aria-label="조회수">
            <FiEye aria-hidden="true" />
            <span className={styles.actionValue}>{data.viewCount.toLocaleString()}</span>
          </button>
          <button type="button" className={styles.actionButton} aria-label="좋아요">
            <FiHeart aria-hidden="true" />
            <span className={styles.actionValue}>{data.likeCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleShareCopy}
            aria-label="공유"
          >
            <FiShare2 aria-hidden="true" />
            <span className={styles.actionValue}>{shareCount.toLocaleString()}</span>
          </button>
        </div>
      </aside>

      <div className={styles.header}>
        <div className={styles.category}>{data.category?.name ?? 'ALL'}</div>
        <h1 className={styles.title}>{data.title}</h1>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>{formatDate(data.publishedAt ?? data.createdAt)}</span>
          <span className={styles.metaDivider} aria-hidden="true">
            ·
          </span>
          <span className={styles.metaItem}>{data.author?.name ?? '익명'}</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mainContent}>
          {thumbnailUrl ? (
            <div className={styles.thumbnail}>
              <Image
                src={thumbnailUrl}
                alt={data.title}
                width={0}
                height={0}
                sizes="100vw"
                unoptimized
                priority
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          ) : null}

          <article className={styles.content}>{previewContent}</article>
        </div>
      </div>
    </section>
  );
}
