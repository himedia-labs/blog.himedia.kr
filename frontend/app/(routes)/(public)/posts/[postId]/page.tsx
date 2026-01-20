'use client';

import { useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import NumberFlow from '@number-flow/react';
import { FaHeart } from 'react-icons/fa';
import { FiEye, FiHeart, FiShare2 } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { useAuthStore } from '@/app/shared/store/authStore';
import { usePostDetailActions } from './postDetail.hooks';
import { formatDate, formatRole } from './postDetail.utils';

import styles from './PostDetail.module.css';
import 'react-loading-skeleton/dist/skeleton.css';

import type { MouseEvent } from 'react';

/**
 * 게시물 상세 페이지
 * @description 게시물 상세 내용과 반응 정보를 표시
 */
export default function PostDetailPage() {
  // 라우트 데이터
  const params = useParams();
  const postId = typeof params?.postId === 'string' ? params.postId : '';
  const { data, isLoading, isError, refetch } = usePostDetailQuery(postId, { enabled: Boolean(postId) });

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);

  // 파생 데이터
  const viewCount = data?.viewCount ?? 0;
  const likeCount = data?.likeCount ?? 0;
  const shareCount = data?.shareCount ?? 0;
  const thumbnailUrl = data?.thumbnailUrl ?? null;

  // 액션 핸들러
  const { handleShareCopy, handleLikeClick, previewContent, tocItems } = usePostDetailActions({ data, postId });
  const handleTocClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  // 토큰 갱신
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    refetch().catch(() => null);
  }, [accessToken, isInitialized, refetch]);

  if (isLoading) {
    return (
      <section className={styles.container} aria-label="게시물 상세">
        <div className={styles.header}>
          <Skeleton width={120} height={12} />
          <Skeleton width="70%" height={42} />
          <Skeleton width={220} height={14} />
        </div>
        <div className={styles.body}>
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
      <div className={styles.header}>
        <div className={styles.category}>{data.category?.name ?? 'ALL'}</div>
        <h1 className={styles.title}>{data.title}</h1>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>{formatDate(data.publishedAt ?? data.createdAt)}</span>
          <span className={styles.metaDivider} aria-hidden="true">
            ·
          </span>
          <span className={styles.metaItem}>
            {data.author?.name ?? '익명'} {data.author?.role && `${formatRole(data.author.role)}`}
          </span>
        </div>
      </div>
      <div className={styles.headerDivider} aria-hidden="true" />

      <div className={styles.body}>
        <aside className={styles.actions} aria-label="게시물 반응">
          <div className={styles.actionsInner}>
            <button
              type="button"
              className={`${styles.actionButton} ${data.liked ? styles.actionButtonActive : ''}`}
              aria-label="좋아요"
              onClick={handleLikeClick}
            >
              {data.liked ? <FaHeart aria-hidden="true" /> : <FiHeart aria-hidden="true" />}
              <span className={styles.actionValue}>
                <NumberFlow value={likeCount} />
              </span>
            </button>
            <div className={styles.actionItem} aria-label="조회수">
              <FiEye aria-hidden="true" />
              <span className={styles.actionValue}>
                <NumberFlow value={viewCount} />
              </span>
            </div>
            <button type="button" className={styles.actionButton} onClick={handleShareCopy} aria-label="공유">
              <FiShare2 aria-hidden="true" />
              <span className={styles.actionValue}>
                <NumberFlow value={shareCount} />
              </span>
            </button>
          </div>
        </aside>
        {tocItems.length > 0 ? (
          <aside className={styles.toc} aria-label="본문 목차">
            <div className={styles.tocInner}>
              <div className={styles.tocTitle}>목차</div>
              <ul className={styles.tocList}>
                {tocItems.map(item => (
                  <li key={item.id} className={styles.tocItem}>
                    <a
                      href={`#${item.id}`}
                      onClick={handleTocClick(item.id)}
                      className={`${styles.tocLink} ${
                        item.level === 2 ? styles.tocLevel2 : item.level === 3 ? styles.tocLevel3 : ''
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}
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
