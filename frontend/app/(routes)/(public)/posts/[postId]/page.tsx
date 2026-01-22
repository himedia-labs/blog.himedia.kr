'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import NumberFlow from '@number-flow/react';
import { FaHeart } from 'react-icons/fa';
import {
  FiClock,
  FiEdit2,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import { useQueryClient } from '@tanstack/react-query';

import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useDeleteCommentMutation, useUpdateCommentMutation } from '@/app/api/comments/comments.mutations';
import { usePostCommentsQuery } from '@/app/api/comments/comments.queries';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';
import { usePostCommentForm } from './postDetail.comments.hooks';
import { usePostDetailActions } from './postDetail.hooks';
import { formatDate, formatDateTime, formatRole } from './postDetail.utils';

import styles from './PostDetail.module.css';
import 'react-loading-skeleton/dist/skeleton.css';

import type { MouseEvent } from 'react';
import type { CommentListResponse } from '@/app/shared/types/comment';

/**
 * 게시물 상세 페이지
 * @description 게시물 상세 내용과 반응 정보를 표시
 */
export default function PostDetailPage() {
  // 라우트 데이터
  const params = useParams();
  const postId = typeof params?.postId === 'string' ? params.postId : '';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading, isError, refetch } = usePostDetailQuery(postId, { enabled: Boolean(postId) });
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = usePostCommentsQuery(postId, {
    enabled: Boolean(postId),
  });
  const { content, handleSubmit, hasLengthError, isSubmitting, setContent } = usePostCommentForm(postId);

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);

  // 파생 데이터
  const likeCount = data?.likeCount ?? 0;
  const viewCount = data?.viewCount ?? 0;
  const shareCount = data?.shareCount ?? 0;
  const commentCount = data?.commentCount ?? 0;
  const thumbnailUrl = data?.thumbnailUrl ?? null;
  const postAuthorId = data?.author?.id ?? null;
  const commentSkeletons = Array.from({ length: 3 });
  const { mutateAsync: deleteComment } = useDeleteCommentMutation(postId);
  const { mutateAsync: updateComment, isPending: isUpdating } = useUpdateCommentMutation(postId);
  const [commentSort, setCommentSort] = useState<'popular' | 'latest'>('latest');
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const hasEditingLengthError = editingContent.length > 1000;
  const commentSortIndex = commentSort === 'popular' ? 0 : 1;
  const sortedComments = useMemo(() => {
    if (!comments?.length) return [];
    if (commentSort === 'popular') {
      return [...comments].sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [commentSort, comments]);

  // 액션 핸들러
  const { handleShareCopy, handleLikeClick, previewContent, tocItems } = usePostDetailActions({ data, postId });
  const handleDeleteComment = async (commentId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    try {
      await deleteComment(commentId);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingContent('');
      }
      setOpenCommentMenuId(null);
      await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    } catch {
      showToast({ message: '댓글 삭제에 실패했습니다.', type: 'error' });
    }
  };
  const handleEditStart = (commentId: string, nextContent: string) => {
    setEditingCommentId(commentId);
    setEditingContent(nextContent);
    setOpenCommentMenuId(null);
  };
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };
  const handleEditSubmit = async (commentId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    const trimmed = editingContent.trim();
    if (!trimmed) {
      showToast({ message: '댓글을 입력해주세요.', type: 'warning' });
      return;
    }
    if (hasEditingLengthError) {
      showToast({ message: '1,000자까지 입력 가능해요.', type: 'warning' });
      return;
    }

    try {
      await updateComment({ commentId, payload: { content: trimmed } });
      handleEditCancel();
      await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    } catch {
      showToast({ message: '댓글 수정에 실패했습니다.', type: 'error' });
    }
  };
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
    refetchComments().catch(() => null);
  }, [accessToken, isInitialized, refetch, refetchComments]);

  // 댓글 해시 스크롤
  useEffect(() => {
    if (!comments || isCommentsLoading) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#comment-')) return;

    const timer = setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [comments, isCommentsLoading]);

  if (isLoading) {
    return (
      <section className={styles.container} aria-label="게시물 상세">
        <div className={styles.header}>
          <Skeleton width={90} height={12} />
          <Skeleton width="75%" height={38} />
          <div className={styles.metaRow}>
            <Skeleton width={120} height={14} />
            <span className={styles.metaDivider} aria-hidden="true">
              ·
            </span>
            <Skeleton width={140} height={14} />
          </div>
        </div>
        <div className={styles.headerDivider} aria-hidden="true" />
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

          <div className={styles.commentDivider} aria-hidden="true" />
          <section aria-label="댓글 작성">
            <div className={styles.commentHeader}>
              <h2 className={styles.commentTitle}>
                댓글 <span className={styles.commentCount}>{commentCount}</span>
              </h2>
            </div>
            <form
              className={styles.commentForm}
              onSubmit={event => {
                event.preventDefault();
                handleSubmit().catch(() => null);
              }}
            >
              <textarea
                className={`${styles.commentTextarea} ${hasLengthError ? styles.commentTextareaError : ''}`}
                placeholder={
                  accessToken
                    ? '허위사실, 욕설, 사칭 등 댓글은 통보 없이 삭제될 수 있으며, 커뮤니티 운영정책에 따라 추가 조치가 이루어질 수 있습니다.'
                    : '로그인 후 댓글을 작성할 수 있어요.'
                }
                value={content}
                onChange={event => setContent(event.target.value)}
                disabled={!accessToken}
              />
              <div className={styles.commentActions}>
                {!accessToken ? (
                  <span className={styles.commentHint}>
                    <Link href={`/login?reason=comment&redirect=/posts/${postId}`}>로그인</Link> 후 이용해주세요.
                  </span>
                ) : hasLengthError ? (
                  <span className={styles.commentError}>1,000자까지 입력 가능해요.</span>
                ) : null}
                <button
                  type="submit"
                  className={
                    content.trim() ? `${styles.commentButton} ${styles.commentButtonActive}` : styles.commentButton
                  }
                  disabled={!accessToken || isSubmitting || hasLengthError}
                >
                  댓글 남기기
                </button>
              </div>
            </form>
            <div className={styles.commentList} aria-live="polite">
              {isCommentsLoading ? (
                commentSkeletons.map((_, index) => (
                  <div key={`comment-skeleton-${index}`} className={styles.commentItem} aria-hidden="true">
                    <div className={styles.commentHeaderRow}>
                      <Skeleton width={120} height={12} />
                      <Skeleton width={60} height={12} />
                    </div>
                    <Skeleton height={16} count={2} />
                  </div>
                ))
              ) : sortedComments.length > 0 ? (
                <>
                  <div className={styles.commentListHeader}>
                    <div className={styles.commentSortGroup} role="tablist" aria-label="댓글 정렬">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={commentSort === 'popular'}
                        className={
                          commentSort === 'popular'
                            ? `${styles.commentSortButton} ${styles.commentSortActive}`
                            : styles.commentSortButton
                        }
                        onClick={() => setCommentSort('popular')}
                      >
                        <FiTrendingUp className={styles.commentSortIcon} aria-hidden="true" />
                        인기순
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={commentSort === 'latest'}
                        className={
                          commentSort === 'latest'
                            ? `${styles.commentSortButton} ${styles.commentSortActive}`
                            : styles.commentSortButton
                        }
                        onClick={() => setCommentSort('latest')}
                      >
                        <FiClock className={styles.commentSortIcon} aria-hidden="true" />
                        최신순
                      </button>
                      <span
                        className={styles.commentSortIndicator}
                        aria-hidden="true"
                        style={{
                          transform:
                            commentSortIndex === 0 ? 'translateX(0)' : 'translateX(calc(100% + 0.6rem))',
                        }}
                      />
                    </div>
                  </div>
                  {sortedComments.map(comment => (
                    <div key={comment.id} id={`comment-${comment.id}`} className={styles.commentItem}>
                      <div className={styles.commentHeaderRow}>
                        <div className={styles.commentProfile}>
                          <span className={styles.commentAvatar} aria-hidden="true" />
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>
                              {comment.author?.name ?? '익명'}{' '}
                              {comment.author?.role ? formatRole(comment.author.role) : ''}
                              {comment.author?.id && comment.author.id === postAuthorId ? ' (작성자)' : ''}
                            </span>
                            <span className={styles.commentDate}>
                              {formatDateTime(comment.createdAt)}
                              {comment.updatedAt !== comment.createdAt ? ' (수정됨)' : ''}
                            </span>
                          </div>
                        </div>
                        {comment.isOwner ? (
                          <div className={styles.commentMoreWrapper}>
                            <button
                              type="button"
                              className={styles.commentMoreButton}
                              aria-label="댓글 옵션"
                              onClick={() =>
                                setOpenCommentMenuId(prev => (prev === comment.id ? null : comment.id))
                              }
                            >
                              <FiMoreHorizontal aria-hidden="true" />
                            </button>
                            {openCommentMenuId === comment.id ? (
                              <div className={styles.commentMoreMenu} role="menu">
                                <button
                                  type="button"
                                  className={styles.commentMoreItem}
                                  role="menuitem"
                                  onClick={() => handleEditStart(comment.id, comment.content)}
                                >
                                  <FiEdit2 aria-hidden="true" />
                                  수정
                                </button>
                                <button
                                  type="button"
                                  className={styles.commentMoreItem}
                                  role="menuitem"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <FiTrash2 aria-hidden="true" />
                                  삭제
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <button type="button" className={styles.commentFollowButton}>
                            팔로우
                          </button>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className={styles.commentEditForm}>
                          <textarea
                            className={`${styles.commentTextarea} ${
                              hasEditingLengthError ? styles.commentTextareaError : ''
                            }`}
                            value={editingContent}
                            onChange={event => setEditingContent(event.target.value)}
                          />
                          <div className={styles.commentEditActions}>
                            {hasEditingLengthError ? (
                              <span className={styles.commentError}>1,000자까지 입력 가능해요.</span>
                            ) : null}
                            <button
                              type="button"
                              className={styles.commentCancelButton}
                              onClick={handleEditCancel}
                              disabled={isUpdating}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className={
                                editingContent.trim()
                                  ? `${styles.commentButton} ${styles.commentButtonActive}`
                                  : styles.commentButton
                              }
                              disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                              onClick={() => handleEditSubmit(comment.id)}
                            >
                              수정 완료
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.commentBody}>{comment.content}</p>
                      )}
                      <div className={styles.commentFooter}>
                        <button
                          type="button"
                          className={`${styles.commentActionButton} ${comment.liked ? styles.commentActionButtonLiked : ''}`}
                          aria-label="좋아요"
                          onClick={async () => {
                            if (!accessToken) {
                              showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
                              return;
                            }
                            try {
                              const result = await commentsApi.toggleCommentLike(postId, comment.id);
                              queryClient.setQueryData(commentsKeys.list(postId), (old: CommentListResponse | undefined) => {
                                if (!old) return old;
                                return old.map(commentItem =>
                                  commentItem.id === comment.id
                                    ? { ...commentItem, likeCount: result.likeCount, liked: result.liked }
                                    : commentItem,
                                );
                              });
                            } catch {
                              // 에러 무시
                            }
                          }}
                        >
                          {comment.liked ? <FaHeart aria-hidden="true" /> : <FiHeart aria-hidden="true" />}
                          {comment.likeCount > 0 ? (
                            <span className={styles.commentActionValue}>
                              <NumberFlow value={comment.likeCount} />
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          className={styles.commentActionButton}
                          aria-label="답글"
                          onClick={() => {
                            if (!accessToken) {
                              showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
                              return;
                            }
                          }}
                        >
                          <FiMessageCircle aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.commentActionButton}
                          aria-label="공유"
                          onClick={() => {
                            const commentUrl = `${window.location.origin}/posts/${postId}#comment-${comment.id}`;
                            navigator.clipboard
                              .writeText(commentUrl)
                              .then(() => {
                                showToast({ message: '링크가 복사되었습니다.', type: 'success' });
                              })
                              .catch(() => {
                                showToast({ message: '링크 복사에 실패했습니다.', type: 'error' });
                              });
                          }}
                        >
                          <FiShare2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
