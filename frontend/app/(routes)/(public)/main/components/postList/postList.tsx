'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useRef } from 'react';

import { PiList } from 'react-icons/pi';
import Skeleton from 'react-loading-skeleton';
import { CiCalendar, CiGrid41 } from 'react-icons/ci';
import { FiEye, FiHeart, FiMessageCircle, FiPlus } from 'react-icons/fi';

import { useAuthStore } from '@/app/shared/store/authStore';

import { usePostList } from '@/app/(routes)/(public)/main/components/postList/hooks';
import {
  createHandleCreatePost,
  createHandleSortFilter,
} from '@/app/(routes)/(public)/main/components/postList/handlers';

import 'react-loading-skeleton/dist/skeleton.css';
import styles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

/**
 * 메인 포스트 리스트
 * @description 게시물 목록과 카테고리, 인기글 영역을 표시
 */
export default function PostListSection() {
  // 라우트 훅
  const router = useRouter();

  // 인증 상태
  const { accessToken } = useAuthStore();

  // 목록 상태
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    viewMode,
    setViewMode,
    sortFilter,
    setSortFilter,
    selectedCategory,
    setSelectedCategory,
    categoryNames,
    filteredPosts,
    topPosts,
    isLoading,
    isCategoriesLoading,
    isTopPostsLoading,
  } = usePostList();

  // 스켈레톤
  const listSkeletons = Array.from({ length: 5 });
  const topSkeletons = Array.from({ length: 5 });
  const cardSkeletons = Array.from({ length: 6 });
  const categorySkeletons = Array.from({ length: 8 });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFollowingEmpty = sortFilter === 'following' && !isLoading && filteredPosts.length === 0;

  // 핸들러
  const handleCreatePost = createHandleCreatePost({ router });
  const handleSortFilter = createHandleSortFilter({ accessToken, router, setSortFilter });

  // 무한 스크롤
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) return;
        fetchNextPage();
      },
      { rootMargin: '200px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section className={styles.container} aria-label="포스트 하이라이트">
      <div className={styles.main}>
        <div className={styles.header}>
          <button type="button" className={styles.createButton} aria-label="게시물 작성" onClick={handleCreatePost}>
            <FiPlus />
          </button>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}
            aria-label={viewMode === 'list' ? '카드 보기' : '리스트 보기'}
          >
            {viewMode === 'list' ? <CiGrid41 /> : <PiList />}
          </button>
        </div>

        <div className={styles.sortBar}>
          <button
            type="button"
            className={sortFilter === 'latest' ? `${styles.sortButton} ${styles.active}` : styles.sortButton}
            onClick={() => handleSortFilter('latest')}
          >
            최신
          </button>
          <button
            type="button"
            className={sortFilter === 'top' ? `${styles.sortButton} ${styles.active}` : styles.sortButton}
            onClick={() => handleSortFilter('top')}
          >
            TOP
          </button>
          <button
            type="button"
            className={sortFilter === 'following' ? `${styles.sortButton} ${styles.active}` : styles.sortButton}
            onClick={() => handleSortFilter('following')}
          >
            피드
          </button>
        </div>

        {isFollowingEmpty ? (
          <div className={styles.emptyState} role="status">
            <p className={styles.emptyTitle}>팔로우한 작성자가 없어요.</p>
            <p className={styles.emptyDescription}>관심있는 작성자를 팔로우하면 피드에 모아서 볼 수 있어요.</p>
          </div>
        ) : viewMode === 'list' ? (
          <ul className={styles.listView}>
            {isLoading
              ? listSkeletons.map((_, index) => (
                  <Fragment key={`list-skeleton-${index}`}>
                    <li>
                      <article className={styles.listItem} aria-hidden="true">
                        <div className={styles.listBody}>
                          <Skeleton height={26} width="70%" />
                          <Skeleton count={2} height={16} style={{ marginBottom: '6px' }} />
                          <div className={styles.meta}>
                            <span className={styles.metaGroup}>
                              <Skeleton width={140} height={12} />
                            </span>
                            <span className={styles.metaGroup}>
                              <Skeleton width={160} height={12} />
                            </span>
                          </div>
                        </div>
                        <Skeleton height={150} width="100%" borderRadius={12} />
                      </article>
                    </li>
                    {index < listSkeletons.length - 1 ? (
                      <li className={styles.listDividerItem} aria-hidden="true">
                        <div className={styles.listDivider} />
                      </li>
                    ) : null}
                  </Fragment>
                ))
              : filteredPosts.map((post, index) => (
                  <Fragment key={post.id}>
                    <li>
                      <Link className={styles.postLink} href={`/posts/${post.id}`}>
                        <article className={styles.listItem}>
                          <div className={styles.listBody}>
                            <h3>{post.title}</h3>
                            <p className={styles.summary}>{post.summary}</p>
                            <div className={styles.meta}>
                              <span className={styles.metaGroup}>
                                <span className={styles.metaItem}>
                                  <CiCalendar aria-hidden="true" /> {post.date}
                                </span>
                                <span className={styles.separator} aria-hidden="true">
                                  |
                                </span>
                                <span className={styles.metaItem}>{post.timeAgo}</span>
                              </span>
                              <span className={styles.metaGroup}>
                                <span className={styles.metaItem}>
                                  <FiEye aria-hidden="true" /> {post.views.toLocaleString()}
                                </span>
                                <span className={styles.separator} aria-hidden="true">
                                  |
                                </span>
                                <span className={styles.metaItem}>
                                  <FiHeart aria-hidden="true" /> {post.likeCount.toLocaleString()}
                                </span>
                                <span className={styles.separator} aria-hidden="true">
                                  |
                                </span>
                                <span className={styles.metaItem}>
                                  <FiMessageCircle aria-hidden="true" /> {post.commentCount.toLocaleString()}
                                </span>
                              </span>
                            </div>
                          </div>
                          {post.imageUrl ? (
                            <div
                              className={styles.listThumb}
                              style={{
                                backgroundImage: `url(${post.imageUrl})`,
                              }}
                              aria-hidden="true"
                            />
                          ) : null}
                        </article>
                      </Link>
                    </li>
                    {index < filteredPosts.length - 1 ? (
                      <li className={styles.listDividerItem} aria-hidden="true">
                        <div className={styles.listDivider} />
                      </li>
                    ) : null}
                  </Fragment>
                ))}
            {isFetchingNextPage
              ? listSkeletons.map((_, index) => (
                  <Fragment key={`list-more-skeleton-${index}`}>
                    <li>
                      <article className={styles.listItem} aria-hidden="true">
                        <div className={styles.listBody}>
                          <Skeleton height={26} width="70%" />
                          <Skeleton count={2} height={16} style={{ marginBottom: '6px' }} />
                          <div className={styles.meta}>
                            <span className={styles.metaGroup}>
                              <Skeleton width={140} height={12} />
                            </span>
                            <span className={styles.metaGroup}>
                              <Skeleton width={160} height={12} />
                            </span>
                          </div>
                        </div>
                        <Skeleton height={150} width="100%" borderRadius={12} />
                      </article>
                    </li>
                    {index < listSkeletons.length - 1 ? (
                      <li className={styles.listDividerItem} aria-hidden="true">
                        <div className={styles.listDivider} />
                      </li>
                    ) : null}
                  </Fragment>
                ))
              : null}
          </ul>
        ) : (
          <ul className={styles.cardGrid}>
            {isLoading
              ? cardSkeletons.map((_, index) => (
                  <li key={`card-skeleton-${index}`}>
                    <article className={styles.cardItem} aria-hidden="true">
                      <Skeleton className={styles.cardThumb} />
                      <div className={styles.cardBody}>
                        <Skeleton height={18} width="75%" />
                        <Skeleton count={2} height={14} style={{ marginBottom: '6px' }} />
                      </div>
                      <div className={styles.cardFooter}>
                        <Skeleton width={140} height={12} />
                      </div>
                    </article>
                  </li>
                ))
              : filteredPosts.map(post => (
                  <li key={post.id}>
                    <Link className={styles.postLink} href={`/posts/${post.id}`}>
                      <article className={styles.cardItem}>
                        {post.imageUrl ? (
                          <div
                            className={styles.cardThumb}
                            style={{
                              backgroundImage: `url(${post.imageUrl})`,
                            }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className={styles.cardBody}>
                          <h3>{post.title}</h3>
                          <p className={styles.summary}>{post.summary}</p>
                        </div>
                        <div className={styles.cardFooter}>
                          <span>{post.date}</span>
                          <span>·</span>
                          <span>{post.timeAgo}</span>
                        </div>
                      </article>
                    </Link>
                  </li>
                ))}
            {isFetchingNextPage
              ? cardSkeletons.map((_, index) => (
                  <li key={`card-more-skeleton-${index}`}>
                    <article className={styles.cardItem} aria-hidden="true">
                      <Skeleton className={styles.cardThumb} />
                      <div className={styles.cardBody}>
                        <Skeleton height={18} width="75%" />
                        <Skeleton count={2} height={14} style={{ marginBottom: '6px' }} />
                      </div>
                      <div className={styles.cardFooter}>
                        <Skeleton width={140} height={12} />
                      </div>
                    </article>
                  </li>
                ))
              : null}
          </ul>
        )}
        {!isFollowingEmpty ? <div ref={sentinelRef} className={styles.infiniteSentinel} aria-hidden="true" /> : null}
      </div>

      <aside className={styles.sidebar} aria-label="TOP 5 인기글">
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarLabel}>
            TOP 5 <span className={styles.sidebarSubLabel}>(인기있는 글)</span>
          </p>
        </div>
        <ol className={styles.topList}>
          {isTopPostsLoading
            ? topSkeletons.map((_, index) => (
                <li key={`top-skeleton-${index}`} aria-hidden="true">
                  <span className={styles.rank}>
                    <Skeleton width="1.2ch" height={14} />
                  </span>
                  <span className={styles.topTitle}>
                    <Skeleton height={14} width="80%" />
                  </span>
                </li>
              ))
            : topPosts.map((item, index) => (
                <li key={item.id}>
                  <span className={styles.rank}>{index + 1}</span>
                  <Link className={styles.topTitle} href={`/posts/${item.id}`}>
                    {item.title}
                  </Link>
                </li>
              ))}
        </ol>
        <div className={styles.sidebarDivider} aria-hidden="true" />

        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarLabel}>
            CATEGORY <span className={styles.sidebarSubLabel}>(카테고리)</span>
          </p>
        </div>
        <div className={styles.categoryList}>
          {isCategoriesLoading
            ? categorySkeletons.map((_, index) => (
                <Skeleton key={`category-skeleton-${index}`} height={32} width={80} borderRadius={20} />
              ))
            : categoryNames.map(category => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory === category ? `${styles.categoryButton} ${styles.active}` : styles.categoryButton
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
        </div>
      </aside>
    </section>
  );
}
