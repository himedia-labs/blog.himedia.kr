'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import MyPagePostsPanel from './MyPagePostsPanel';
import styles from './MyPage.module.css';

const getActiveTab = (value?: string | null) => {
  if (value === 'comments' || value === 'likes' || value === 'posts') return value;
  return 'settings';
};

export default function MyPage() {
  const searchParams = useSearchParams();
  const activeTab = getActiveTab(searchParams.get('tab'));

  return (
    <section className={styles.container} aria-label="마이페이지">
      <div className={styles.layout}>
        <div>
          <nav className={styles.list} aria-label="마이페이지 메뉴">
            <Link
              className={activeTab === 'settings' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
              href="/mypage"
            >
              내 정보
            </Link>
            <div className={styles.listDividerLine} aria-hidden="true" />
            <Link
              className={activeTab === 'posts' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
              href="/mypage?tab=posts"
            >
              내 블로그
            </Link>
            <Link
              className={activeTab === 'comments' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
              href="/mypage?tab=comments"
            >
              남긴 댓글
            </Link>
            <Link
              className={activeTab === 'likes' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
              href="/mypage?tab=likes"
            >
              좋아요
            </Link>
          </nav>
        </div>
        <div className={styles.main}>
          <MyPagePostsPanel defaultTab={activeTab} />
        </div>
      </div>
    </section>
  );
}
