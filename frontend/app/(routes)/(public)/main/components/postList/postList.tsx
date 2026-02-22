'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useRef } from 'react';

import { PiList } from 'react-icons/pi';
import LinesEllipsis from 'react-lines-ellipsis';
import Skeleton from 'react-loading-skeleton';
import { FaUser } from 'react-icons/fa6';
import { CiCalendar, CiGrid41 } from 'react-icons/ci';
import { FiEye, FiHeart, FiMessageCircle, FiPlus, FiShare2 } from 'react-icons/fi';

import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { useAuthStore } from '@/app/shared/store/authStore';

import { usePostList, usePostListInfiniteScroll } from '@/app/(routes)/(public)/main/components/postList/hooks';
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
  const { data: currentUser } = useCurrentUserQuery();

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
  const listTagSkeletonWidths = [48, 64, 56];
  const cardTagSkeletonWidths = [44, 58, 50];
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFollowingEmpty = sortFilter === 'following' && !isLoading && filteredPosts.length === 0;

  // 핸들러
  const handleCreatePost = createHandleCreatePost({ router });
  const handleSortFilter = createHandleSortFilter({ accessToken, router, setSortFilter });

  // 무한 스크롤
  usePostListInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage, sentinelRef });

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
                          <div className={styles.skeletonSummary}>
                            <Skeleton count={2} height={16} />
                          </div>
                          <ul className={styles.listTagList} aria-hidden="true">
                            {listTagSkeletonWidths.map(width => (
                              <li key={`list-tag-skeleton-${index}-${width}`}>
                                <Skeleton height={24} width={width} borderRadius={4} />
                              </li>
                            ))}
                          </ul>
                          <div className={styles.meta}>
                            <div className={styles.metaAuthorDate}>
                              <div className={styles.cardAuthor}>
                                <Skeleton circle width={24} height={24} />
                                <Skeleton width={80} height={12} />
                              </div>
                              <span className={styles.separator} aria-hidden="true">
                                |
                              </span>
                              <span className={styles.metaGroup}>
                                <Skeleton width={140} height={12} />
                              </span>
                            </div>
                            <span className={styles.metaGroup}>
                              <Skeleton width={160} height={12} />
                            </span>
                          </div>
                        </div>
                        <Skeleton height={180} width="100%" borderRadius={12} />
                      </article>
                    </li>
                    {index < listSkeletons.length - 1 ? (
                      <li className={styles.listDividerItem} aria-hidden="true">
                        <div className={styles.listDivider} />
                      </li>
                    ) : null}
                  </Fragment>
                ))
              : filteredPosts.map((post, index) => {
                  const isMyPost = !!currentUser?.id && currentUser.id === post.authorId;
                  const thumbnailImageUrl = post.imageUrl;
                  const hasThumbnail = Boolean(thumbnailImageUrl);
                  const listTags = post.tags.slice(0, 5);
                  return (
                    <Fragment key={post.id}>
                      <li>
                        <Link className={styles.postLink} href={`/posts/${post.id}`}>
                          <article
                            className={hasThumbnail ? styles.listItem : `${styles.listItem} ${styles.listItemNoThumb}`}
                          >
                            <div className={styles.listBody}>
                              <h3>{post.title}</h3>
                              {post.content ? (
                                <LinesEllipsis
                                  text={post.content}
                                  maxLine="2"
                                  ellipsis="..."
                                  trimRight
                                  basedOn="letters"
                                  className={styles.summary}
                                />
                              ) : null}
                              {listTags.length > 0 ? (
                                <ul className={styles.listTagList} aria-label="태그 목록">
                                  {listTags.map(tagName => (
                                    <li key={`${post.id}-list-${tagName}`} className={styles.listTagItem}>
                                      #{tagName}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <div className={styles.meta}>
                                <div className={styles.metaAuthorDate}>
                                  <div className={styles.cardAuthor}>
                                    <div
                                      className={
                                        isMyPost
                                          ? `${styles.cardAuthorAvatar} ${styles.cardAuthorAvatarMine}`
                                          : styles.cardAuthorAvatar
                                      }
                                      aria-hidden="true"
                                    >
                                      {post.authorProfileImageUrl ? (
                                        <Image
                                          className={styles.cardAuthorImage}
                                          src={post.authorProfileImageUrl}
                                          alt=""
                                          width={24}
                                          height={24}
                                          unoptimized
                                        />
                                      ) : (
                                        <FaUser />
                                      )}
                                    </div>
                                    <span className={styles.cardAuthorText}>
                                      <span className={styles.cardAuthorBy}>by.</span>
                                      <span className={styles.cardAuthorName}>{post.authorName}</span>
                                    </span>
                                  </div>
                                  <span className={styles.separator} aria-hidden="true">
                                    |
                                  </span>
                                  <span className={styles.metaGroup}>
                                    <span className={styles.metaItem}>
                                      <CiCalendar aria-hidden="true" /> {post.date}
                                    </span>
                                    <span className={styles.separator} aria-hidden="true">
                                      |
                                    </span>
                                    <span className={styles.metaItem}>{post.timeAgo}</span>
                                  </span>
                                </div>
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
                            {thumbnailImageUrl ? (
                              <div className={styles.listThumb} aria-hidden="true">
                                <Image
                                  className={styles.listThumbImage}
                                  src={thumbnailImageUrl}
                                  alt=""
                                  width={0}
                                  height={0}
                                  sizes="100vw"
                                  unoptimized
                                  style={{ width: '100%', height: '100%' }}
                                />
                              </div>
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
                  );
                })}
            {isFetchingNextPage
              ? listSkeletons.map((_, index) => (
                  <Fragment key={`list-more-skeleton-${index}`}>
                    <li>
                      <article className={styles.listItem} aria-hidden="true">
                        <div className={styles.listBody}>
                          <Skeleton height={26} width="70%" />
                          <div className={styles.skeletonSummary}>
                            <Skeleton count={2} height={16} />
                          </div>
                          <ul className={styles.listTagList} aria-hidden="true">
                            {listTagSkeletonWidths.map(width => (
                              <li key={`list-more-tag-skeleton-${index}-${width}`}>
                                <Skeleton height={24} width={width} borderRadius={4} />
                              </li>
                            ))}
                          </ul>
                          <div className={styles.meta}>
                            <div className={styles.metaAuthorDate}>
                              <div className={styles.cardAuthor}>
                                <Skeleton circle width={24} height={24} />
                                <Skeleton width={80} height={12} />
                              </div>
                              <span className={styles.separator} aria-hidden="true">
                                |
                              </span>
                              <span className={styles.metaGroup}>
                                <Skeleton width={140} height={12} />
                              </span>
                            </div>
                            <span className={styles.metaGroup}>
                              <Skeleton width={160} height={12} />
                            </span>
                          </div>
                        </div>
                        <Skeleton height={180} width="100%" borderRadius={12} />
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
                      <div className={styles.cardTop}>
                        <Skeleton className={styles.cardThumb} />
                        <div className={styles.cardBody}>
                          <Skeleton height={18} width="75%" />
                          <div className={styles.skeletonSummary}>
                            <Skeleton count={2} height={14} />
                          </div>
                        </div>
                      </div>
                      <ul className={`${styles.cardTagList} ${styles.cardTagListWithThumb}`} aria-hidden="true">
                        {cardTagSkeletonWidths.map(width => (
                          <li key={`card-tag-skeleton-${index}-${width}`}>
                            <Skeleton height={24} width={width} borderRadius={4} />
                          </li>
                        ))}
                      </ul>
                      <div className={styles.cardFooter}>
                        <div className={styles.cardDateRow}>
                          <Skeleton width={140} height={12} />
                        </div>
                        <div className={styles.cardFooterDivider} />
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
                ))
              : filteredPosts.map(post => {
                  const thumbnailImageUrl = post.imageUrl;
                  const hasThumbnail = Boolean(thumbnailImageUrl);
                  const cardTags = post.tags.slice(0, 5);
                  const displayCardTags = cardTags.map(tagName => `#${tagName}`);
                  const hasCardTags = cardTags.length > 0;
                  const noThumbNoTag = !hasThumbnail && !hasCardTags;
                  const cardTitle = post.title;
                  const cardFooterClassName = `${styles.cardFooter} ${styles.cardFooterWithThumb}`;
                  const isMyPost = !!currentUser?.id && currentUser.id === post.authorId;
                  const cardItemClassName = noThumbNoTag
                    ? `${styles.cardItem} ${styles.cardItemNoThumbNoTags}`
                    : styles.cardItem;
                  const cardBodyClassName = hasThumbnail
                    ? styles.cardBody
                    : `${styles.cardBody} ${styles.cardBodyNoThumb} ${
                        hasCardTags ? styles.cardBodyNoThumbWithTags : ''
                      } ${noThumbNoTag ? styles.cardBodyNoThumbNoTags : ''}`;
                  const cardTagListClassName = hasThumbnail
                    ? `${styles.cardTagList} ${styles.cardTagListWithThumb}`
                    : styles.cardTagList;
                  const cardTextClassName = hasThumbnail
                    ? `${styles.cardText} ${styles.cardTextWithThumb}`
                    : styles.cardText;
                  return (
                    <li key={post.id}>
                      <Link className={styles.postLink} href={`/posts/${post.id}`}>
                        <article className={cardItemClassName}>
                          <div className={styles.cardTop}>
                            {thumbnailImageUrl ? (
                              <div className={styles.cardThumb} aria-hidden="true">
                                <Image
                                  className={styles.cardThumbImage}
                                  src={thumbnailImageUrl}
                                  alt=""
                                  width={0}
                                  height={0}
                                  sizes="100vw"
                                  unoptimized
                                  style={{ width: '100%', height: '100%' }}
                                />
                              </div>
                            ) : null}
                            <div className={cardBodyClassName}>
                              <div className={cardTextClassName}>
                                <h3>{cardTitle}</h3>
                                {post.content ? (
                                  <LinesEllipsis
                                    text={post.content}
                                    maxLine="2"
                                    ellipsis="..."
                                    trimRight
                                    basedOn="letters"
                                    className={styles.summary}
                                  />
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {cardTags.length > 0 ? (
                            <ul className={cardTagListClassName} aria-label="태그 목록">
                              {displayCardTags.map((displayTag, index) => (
                                <li key={`${post.id}-card-${cardTags[index]}`} className={styles.cardTagItem}>
                                  {displayTag}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <div className={cardFooterClassName}>
                            <div className={styles.cardDateRow}>
                              <span>{post.date}</span>
                              <span>·</span>
                              <span>{post.timeAgo}</span>
                            </div>
                            <div className={styles.cardFooterDivider} aria-hidden="true" />
                            <div className={styles.cardMetaRow}>
                              <div className={styles.cardAuthor}>
                                <div
                                  className={
                                    isMyPost
                                      ? `${styles.cardAuthorAvatar} ${styles.cardAuthorAvatarMine}`
                                      : styles.cardAuthorAvatar
                                  }
                                  aria-hidden="true"
                                >
                                  {post.authorProfileImageUrl ? (
                                    <Image
                                      className={styles.cardAuthorImage}
                                      src={post.authorProfileImageUrl}
                                      alt=""
                                      width={24}
                                      height={24}
                                      unoptimized
                                    />
                                  ) : (
                                    <FaUser />
                                  )}
                                </div>
                                <span className={styles.cardAuthorText}>
                                  <span className={styles.cardAuthorBy}>by.</span>
                                  <span className={styles.cardAuthorName}>{post.authorName}</span>
                                </span>
                              </div>
                              <div className={styles.cardStats}>
                                <span className={styles.cardStat}>
                                  <span className={styles.cardStatIcon}>
                                    <FiHeart aria-hidden="true" />
                                  </span>
                                  <span className={styles.cardStatCount}>{post.likeCount.toLocaleString()}</span>
                                </span>
                                <span className={styles.cardStat}>
                                  <span className={styles.cardStatIcon}>
                                    <FiEye aria-hidden="true" />
                                  </span>
                                  <span className={styles.cardStatCount}>{post.views.toLocaleString()}</span>
                                </span>
                                <span className={styles.cardStat}>
                                  <span className={styles.cardStatIcon}>
                                    <FiShare2 aria-hidden="true" />
                                  </span>
                                  <span className={styles.cardStatCount}>{post.shareCount.toLocaleString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    </li>
                  );
                })}
            {isFetchingNextPage
              ? cardSkeletons.map((_, index) => (
                  <li key={`card-more-skeleton-${index}`}>
                    <article className={styles.cardItem} aria-hidden="true">
                      <div className={styles.cardTop}>
                        <Skeleton className={styles.cardThumb} />
                        <div className={styles.cardBody}>
                          <Skeleton height={18} width="75%" />
                          <div className={styles.skeletonSummary}>
                            <Skeleton count={2} height={14} />
                          </div>
                        </div>
                      </div>
                      <ul className={`${styles.cardTagList} ${styles.cardTagListWithThumb}`} aria-hidden="true">
                        {cardTagSkeletonWidths.map(width => (
                          <li key={`card-more-tag-skeleton-${index}-${width}`}>
                            <Skeleton height={24} width={width} borderRadius={4} />
                          </li>
                        ))}
                      </ul>
                      <div className={styles.cardFooter}>
                        <div className={styles.cardDateRow}>
                          <Skeleton width={140} height={12} />
                        </div>
                        <div className={styles.cardFooterDivider} />
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
                    <LinesEllipsis text={item.title} maxLine="1" ellipsis="..." trimRight basedOn="letters" />
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
