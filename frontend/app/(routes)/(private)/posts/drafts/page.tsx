'use client';

import Link from 'next/link';

import { useAuthStore } from '@/app/shared/store/authStore';
import { useDraftsQuery } from '@/app/api/posts/posts.queries';

import styles from './DraftList.module.css';

export default function DraftListPage() {
  const { accessToken } = useAuthStore();
  const { data, isLoading } = useDraftsQuery(undefined, { enabled: !!accessToken });
  const drafts = data?.items ?? [];

  return (
    <section className={styles.container} aria-label="임시저장 목록">
      <header className={styles.header}>
        <h1 className={styles.title}>임시저장 목록</h1>
        <p className={styles.description}>작성 중인 게시물을 이어서 편집할 수 있습니다.</p>
      </header>
      {isLoading ? (
        <p className={styles.notice}>불러오는 중...</p>
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
