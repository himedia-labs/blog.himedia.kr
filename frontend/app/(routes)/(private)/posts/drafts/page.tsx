'use client';

import Link from 'next/link';
import Skeleton from 'react-loading-skeleton';

import { useDraftsQuery } from '@/app/api/posts/posts.queries';
import { useAuthStore } from '@/app/shared/store/authStore';

import 'react-loading-skeleton/dist/skeleton.css';
import styles from '@/app/(routes)/(private)/posts/drafts/DraftList.module.css';

/**
 * 임시저장 목록 페이지
 * @description 작성 중인 게시물 목록을 로딩/빈 상태와 함께 표시
 */
export default function DraftListPage() {
  // 인증 상태
  const { accessToken } = useAuthStore();

  // 데이터 조회
  const { data, isLoading } = useDraftsQuery(undefined, { enabled: !!accessToken });
  const drafts = data?.items ?? [];

  return (
    <section className={styles.container} aria-label="임시저장 목록">
      <header className={styles.header}>
        <h1 className={styles.title}>임시저장 목록</h1>
        <p className={styles.description}>작성 중인 게시물을 이어서 편집할 수 있습니다.</p>
      </header>
      {isLoading ? (
        <ul className={styles.list} aria-label="임시저장 로딩">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={`draft-skeleton-${index}`} className={styles.item} aria-hidden="true">
              <div className={styles.info}>
                <Skeleton height={18} width="60%" />
                <Skeleton height={12} width="30%" />
              </div>
              <Skeleton height={28} width={64} />
            </li>
          ))}
        </ul>
      ) : drafts.length ? (
        <ul className={styles.list}>
          {drafts.map(draft => (
            <li key={draft.id} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.itemTitle}>{draft.title || '제목 없음'}</span>
                <span className={styles.itemMeta}>{draft.category?.name ?? '카테고리 없음'}</span>
              </div>
              <Link className={styles.itemLink} href={`/posts/new?draftId=${draft.id}`}>
                불러오기
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.notice}>임시저장된 게시물이 없습니다.</p>
      )}
    </section>
  );
}
