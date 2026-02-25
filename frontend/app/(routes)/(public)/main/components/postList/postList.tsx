'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { PiList } from 'react-icons/pi';
import Skeleton from 'react-loading-skeleton';
import { FaUser } from 'react-icons/fa6';
import { CiCalendar, CiGrid41 } from 'react-icons/ci';
import { FiEye, FiFlag, FiHeart, FiMessageCircle, FiPlus, FiShare2 } from 'react-icons/fi';

import { adminApi } from '@/app/api/admin/admin.api';
import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { notificationsKeys } from '@/app/api/notifications/notifications.keys';
import { uploadsApi } from '@/app/api/uploads/uploads.api';
import ActionModal from '@/app/shared/components/modal/ActionModal';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';

import BugReportForm from '@/app/(routes)/(public)/main/components/bugReport/BugReportForm';
import ListPostTagList from '@/app/(routes)/(public)/main/components/postList/components/ListPostTagList';
import { usePostList, usePostListInfiniteScroll } from '@/app/(routes)/(public)/main/components/postList/hooks';
import {
  createHandleCreatePost,
  createHandleSortFilter,
} from '@/app/(routes)/(public)/main/components/postList/handlers';
import CardPostSkeletonItem from '@/app/(routes)/(public)/main/components/postList/postList.skeleton';
import { getVisibleCardTags } from '@/app/(routes)/(public)/main/components/postList/utils';

import 'react-loading-skeleton/dist/skeleton.css';
import styles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

import type { KeyboardEvent } from 'react';

const NOTICE_TITLE_MAX_LENGTH = 30;
const NOTICE_CONTENT_MAX_LENGTH = 3000;
const NOTICE_ATTACHMENT_MAX_COUNT = 3;
type NoticeAttachment = { name: string; url: string };

/**
 * 메인 포스트 리스트
 * @description 게시물 목록과 카테고리, 인기글 영역을 표시
 */
export default function PostListSection() {
  // 라우트 훅
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 인증 상태
  const { accessToken } = useAuthStore();
  const { data: currentUser } = useCurrentUserQuery();
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isNoticeSubmitting, setIsNoticeSubmitting] = useState(false);
  const [isNoticeImageUploading, setIsNoticeImageUploading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAttachments, setNoticeAttachments] = useState<NoticeAttachment[]>([]);

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
  const noticeTitleLimitToastAtRef = useRef(0);
  const noticeContentLimitToastAtRef = useRef(0);
  const noticeImageInputRef = useRef<HTMLInputElement | null>(null);
  const isFollowingEmpty = sortFilter === 'following' && !isLoading && filteredPosts.length === 0;

  // 핸들러
  const handleCreatePost = createHandleCreatePost({ router });
  const handleSortFilter = createHandleSortFilter({ accessToken, router, setSortFilter });

  /**
   * 공지 입력 모달 열기
   * @description 좌측 하단 버튼 클릭 시 입력 모달을 연다
   */
  const handleOpenNoticeModal = () => {
    setIsNoticeModalOpen(true);
  };

  /**
   * 공지 입력 모달 닫기
   * @description 입력값을 초기화하고 모달을 닫는다
   */
  const handleCloseNoticeModal = () => {
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeAttachments([]);
    setIsNoticeImageUploading(false);
    setIsNoticeModalOpen(false);
  };

  /**
   * 공지 입력 등록
   * @description 간단 입력값 유효성 검증 후 신고 데이터를 저장한다
   */
  const handleSubmitNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast({ message: '제목과 내용을 입력해주세요.', type: 'warning' });
      return;
    }
    if (noticeTitle.trim().length > NOTICE_TITLE_MAX_LENGTH) {
      showToast({ message: `제목은 최대 ${NOTICE_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
      return;
    }
    if (noticeContent.trim().length > NOTICE_CONTENT_MAX_LENGTH) {
      showToast({ message: `내용은 최대 ${NOTICE_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
      return;
    }

    try {
      setIsNoticeSubmitting(true);
      const attachmentText = noticeAttachments.length
        ? `\n\n첨부 이미지:\n${noticeAttachments.map(item => `- ${item.url}`).join('\n')}`
        : '';
      const contentWithImage = `${noticeContent.trim()}${attachmentText}`;
      await adminApi.createReport({ title: noticeTitle.trim(), content: contentWithImage });
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      showToast({ message: '버그 제보가 접수되었습니다.', type: 'success' });
      handleCloseNoticeModal();
    } catch {
      showToast({ message: '버그 제보 등록에 실패했습니다.', type: 'error' });
    } finally {
      setIsNoticeSubmitting(false);
    }
  };

  /**
   * 제목 입력 제한
   * @description 최대 글자수 초과 입력을 차단하고 안내 토스트를 표시한다
   */
  const handleNoticeTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const key = event.key;
    const isControlKey =
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'Tab' ||
      key === 'Enter';

    if (event.nativeEvent.isComposing || event.metaKey || event.ctrlKey || event.altKey || isControlKey) return;
    if (target.selectionStart !== target.selectionEnd) return;
    if (noticeTitle.length < NOTICE_TITLE_MAX_LENGTH) return;

    event.preventDefault();

    const now = Date.now();
    if (now - noticeTitleLimitToastAtRef.current < 1000) return;
    noticeTitleLimitToastAtRef.current = now;
    showToast({ message: `제목은 최대 ${NOTICE_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
  };

  /**
   * 제목 변경 처리
   * @description 붙여넣기/조합 입력까지 포함해 제목 길이를 최대값으로 고정한다
   */
  const handleNoticeTitleChange = (nextValue: string) => {
    if (nextValue.length <= NOTICE_TITLE_MAX_LENGTH) {
      setNoticeTitle(nextValue);
      return;
    }

    const trimmedValue = nextValue.slice(0, NOTICE_TITLE_MAX_LENGTH);
    setNoticeTitle(trimmedValue);

    const now = Date.now();
    if (now - noticeTitleLimitToastAtRef.current < 1000) return;
    noticeTitleLimitToastAtRef.current = now;
    showToast({ message: `제목은 최대 ${NOTICE_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
  };

  /**
   * 내용 입력 제한
   * @description 최대 글자수 초과 입력을 차단하고 안내 토스트를 표시한다
   */
  const handleNoticeContentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const key = event.key;
    const isControlKey =
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'Tab';

    if (event.nativeEvent.isComposing || event.metaKey || event.ctrlKey || event.altKey || isControlKey) return;
    if (target.selectionStart !== target.selectionEnd) return;
    if (noticeContent.length < NOTICE_CONTENT_MAX_LENGTH) return;

    event.preventDefault();

    const now = Date.now();
    if (now - noticeContentLimitToastAtRef.current < 1000) return;
    noticeContentLimitToastAtRef.current = now;
    showToast({ message: `내용은 최대 ${NOTICE_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
  };

  /**
   * 내용 변경 처리
   * @description 붙여넣기/조합 입력까지 포함해 내용 길이를 최대값으로 고정한다
   */
  const handleNoticeContentChange = (nextValue: string) => {
    if (nextValue.length <= NOTICE_CONTENT_MAX_LENGTH) {
      setNoticeContent(nextValue);
      return;
    }

    const trimmedValue = nextValue.slice(0, NOTICE_CONTENT_MAX_LENGTH);
    setNoticeContent(trimmedValue);

    const now = Date.now();
    if (now - noticeContentLimitToastAtRef.current < 1000) return;
    noticeContentLimitToastAtRef.current = now;
    showToast({ message: `내용은 최대 ${NOTICE_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`, type: 'warning' });
  };

  /**
   * 첨부 이미지 선택 클릭
   * @description 숨김 파일 입력을 열어 첨부 이미지를 선택
   */
  const handleClickNoticeImageUpload = () => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이미지 첨부가 가능합니다.', type: 'warning' });
      return;
    }
    noticeImageInputRef.current?.click();
  };

  /**
   * 첨부 이미지 업로드
   * @description 선택한 이미지를 업로드하고 첨부 URL을 저장
   */
  const handleChangeNoticeImage = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!accessToken) {
      showToast({ message: '로그인 후 이미지 첨부가 가능합니다.', type: 'warning' });
      return;
    }

    try {
      const remainingCount = NOTICE_ATTACHMENT_MAX_COUNT - noticeAttachments.length;
      if (remainingCount <= 0) {
        showToast({ message: `이미지는 최대 ${NOTICE_ATTACHMENT_MAX_COUNT}개까지 첨부할 수 있습니다.`, type: 'warning' });
        return;
      }

      if (files.length > remainingCount) {
        showToast({ message: `이미지는 최대 ${NOTICE_ATTACHMENT_MAX_COUNT}개까지 첨부할 수 있습니다.`, type: 'warning' });
      }

      setIsNoticeImageUploading(true);
      const selectedFiles = Array.from(files).slice(0, remainingCount);
      const uploadedAttachments: NoticeAttachment[] = [];
      for (const file of selectedFiles) {
        const result = await uploadsApi.uploadImage(file);
        uploadedAttachments.push({ name: file.name, url: result.url });
      }
      setNoticeAttachments(prev => [...prev, ...uploadedAttachments]);
      showToast({ message: '이미지가 첨부되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '이미지 첨부에 실패했습니다.', type: 'error' });
    } finally {
      setIsNoticeImageUploading(false);
      if (noticeImageInputRef.current) noticeImageInputRef.current.value = '';
    }
  };

  /**
   * 첨부 파일 제거
   * @description 선택한 첨부 파일을 목록에서 삭제
   */
  const handleRemoveNoticeAttachment = (targetUrl: string) => {
    setNoticeAttachments(prev => prev.filter(item => item.url !== targetUrl));
  };

  // 무한 스크롤
  usePostListInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage, sentinelRef });

  return (
    <section className={styles.container} aria-label="포스트 하이라이트">
      <div className={styles.main}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.bugReportButton}
            aria-label="버그 신고"
            title="버그 신고"
            onClick={handleOpenNoticeModal}
          >
            <FiFlag />
          </button>
          <button
            type="button"
            className={styles.createButton}
            aria-label="게시물 작성"
            onClick={handleCreatePost}
          >
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
          <span className={styles.sortDivider} aria-hidden="true">
            |
          </span>
          <button type="button" className={styles.sortButton}>
            Q&A
          </button>
          <button type="button" className={styles.sortButton}>
            채용
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
                  const displayListTags = listTags.map(tagName => `#${tagName}`);
                  const hasListTags = displayListTags.length > 0;
                  return (
                    <Fragment key={post.id}>
                      <li>
                        <Link className={styles.postLink} href={`/posts/${post.id}`}>
                          <article
                            className={
                              hasThumbnail
                                ? styles.listItem
                                : `${styles.listItem} ${styles.listItemNoThumb}`
                            }
                          >
                            <div className={styles.listBody}>
                              <h3 className={styles.listTitle}>{post.title}</h3>
                              {post.content ? (
                                <p className={hasListTags ? styles.listSummaryWithTags : styles.listSummary}>
                                  {post.content}
                                </p>
                              ) : null}
                              {hasListTags ? <ListPostTagList postId={post.id} tags={displayListTags} /> : null}
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
                  <CardPostSkeletonItem
                    key={`card-skeleton-${index}`}
                    index={index}
                    cardTagSkeletonWidths={cardTagSkeletonWidths}
                    skeletonKeyPrefix="card-skeleton"
                  />
                ))
              : filteredPosts.map(post => {
                  const thumbnailImageUrl = post.imageUrl;
                  const hasThumbnail = Boolean(thumbnailImageUrl);
                  const cardTags = post.tags.slice(0, 5);
                  const displayCardTags = cardTags.map(tagName => `#${tagName}`);
                  const { hiddenCount, visibleTags } = getVisibleCardTags(displayCardTags);
                  const hasCardTags = cardTags.length > 0;
                  const noThumbNoTag = !hasThumbnail && !hasCardTags;
                  const hasVisibleCardTags = visibleTags.length > 0;
                  const hasTagsWithThumbnail = hasThumbnail && hasVisibleCardTags;
                  const hasTagsWithoutThumbnail = !hasThumbnail && hasVisibleCardTags;
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
                                <h3 className={styles.cardTitle}>{cardTitle}</h3>
                                {post.content ? (
                                  <p
                                    className={
                                      hasTagsWithThumbnail
                                        ? styles.cardSummaryThumbTag
                                        : hasThumbnail
                                          ? styles.cardSummaryThumb
                                          : hasTagsWithoutThumbnail
                                            ? styles.cardSummaryTag
                                            : styles.cardSummary
                                    }
                                  >
                                    {post.content}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {hasVisibleCardTags ? (
                            <ul className={cardTagListClassName} aria-label="태그 목록">
                              {visibleTags.map((displayTag, index) => (
                                <li key={`${post.id}-card-${index}-${displayTag}`} className={styles.cardTagItem}>
                                  {displayTag}
                                </li>
                              ))}
                              {hiddenCount > 0 ? (
                                <li className={styles.cardTagItem} aria-label={`숨겨진 태그 ${hiddenCount}개`}>
                                  +{hiddenCount}
                                </li>
                              ) : null}
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
                  <CardPostSkeletonItem
                    key={`card-more-skeleton-${index}`}
                    index={index}
                    cardTagSkeletonWidths={cardTagSkeletonWidths}
                    skeletonKeyPrefix="card-more-skeleton"
                  />
                ))
              : null}
          </ul>
        )}
        {!isFollowingEmpty ? <div ref={sentinelRef} className={styles.infiniteSentinel} aria-hidden="true" /> : null}
      </div>

      {isNoticeModalOpen ? (
        <ActionModal
          title="버그 제보"
          body={
            <BugReportForm
              noticeTitle={noticeTitle}
              noticeContent={noticeContent}
              noticeAttachments={noticeAttachments}
              isNoticeImageUploading={isNoticeImageUploading}
              noticeTitleMaxLength={NOTICE_TITLE_MAX_LENGTH}
              noticeContentMaxLength={NOTICE_CONTENT_MAX_LENGTH}
              noticeImageInputRef={noticeImageInputRef}
              onTitleKeyDown={handleNoticeTitleKeyDown}
              onTitleChange={handleNoticeTitleChange}
              onContentKeyDown={handleNoticeContentKeyDown}
              onContentChange={handleNoticeContentChange}
              onClickImageUpload={handleClickNoticeImageUpload}
              onSelectImageFiles={handleChangeNoticeImage}
              onRemoveAllAttachments={() => setNoticeAttachments([])}
              onRemoveAttachment={handleRemoveNoticeAttachment}
            />
          }
          confirmLabel="등록"
          cancelLabel="닫기"
          confirmDisabled={!noticeTitle.trim() || !noticeContent.trim() || isNoticeSubmitting || isNoticeImageUploading}
          cancelDisabled={isNoticeSubmitting || isNoticeImageUploading}
          onClose={isNoticeSubmitting || isNoticeImageUploading ? () => undefined : handleCloseNoticeModal}
          onConfirm={handleSubmitNotice}
        />
      ) : null}

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
