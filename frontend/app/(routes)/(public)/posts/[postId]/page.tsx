'use client';

import { Fragment, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { FaHeart } from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { FaFacebookF, FaLinkedinIn, FaUser, FaXTwitter } from 'react-icons/fa6';
import NumberFlow from '@number-flow/react';
import {
  FiClock,
  FiEdit2,
  FiEye,
  FiExternalLink,
  FiFlag,
  FiGithub,
  FiGlobe,
  FiHeart,
  FiMail,
  FiShare2,
  FiSlash,
  FiTrash2,
  FiTrendingUp,
  FiMessageCircle,
  FiMoreHorizontal,
  FiCornerDownRight,
} from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import { useAuthStore } from '@/app/shared/store/authStore';
import { followsApi } from '@/app/api/follows/follows.api';
import { postsApi } from '@/app/api/posts/posts.api';
import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { LOGIN_MESSAGES } from '@/app/shared/constants/messages/auth.message';
import { isCommentContentTooLong } from '@/app/shared/utils/comment.utils';
import { formatPostPreview } from '@/app/shared/utils/formatPostPreview.utils';
import { createTocClickHandler } from '@/app/(routes)/(public)/posts/[postId]/handlers';
import {
  usePostDetailComments,
  usePostDetailActions,
  usePostDetailRefresh,
} from '@/app/(routes)/(public)/posts/[postId]/hooks';
import {
  formatDate,
  formatDateTime,
  formatRole,
  getMentionHighlightSegments,
  splitCommentMentions,
} from '@/app/(routes)/(public)/posts/[postId]/utils';

import 'react-loading-skeleton/dist/skeleton.css';
import { useToast } from '@/app/shared/components/toast/toast';
import markdownStyles from '@/app/shared/components/markdown-editor/markdown.module.css';
import styles from '@/app/(routes)/(public)/posts/[postId]/PostDetail.module.css';

/**
 * 게시물 상세 페이지
 * @description 게시물 상세 내용과 반응 정보를 표시
 */
export default function PostDetailPage() {
  // 라우트 데이터
  const params = useParams();
  const postId = typeof params?.postId === 'string' ? params.postId : '';

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const { showToast } = useToast();
  const { data: currentUser } = useCurrentUserQuery();
  const [isPostDeleting, setIsPostDeleting] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isAuthorFollowing, setIsAuthorFollowing] = useState(false);
  const [isAuthorFollowHover, setIsAuthorFollowHover] = useState(false);
  const [isAuthorFollowLoading, setIsAuthorFollowLoading] = useState(false);
  const [authorFollowerCount, setAuthorFollowerCount] = useState(0);

  // 요청 훅
  const isQueryEnabled = Boolean(postId) && isInitialized;
  const { data, isLoading, isError, refetch } = usePostDetailQuery(postId, { enabled: isQueryEnabled });

  // 파생 데이터
  const viewCount = data?.viewCount ?? 0;
  const likeCount = data?.likeCount ?? 0;
  const shareCount = data?.shareCount ?? 0;
  const commentCount = data?.commentCount ?? 0;
  const postAuthorId = data?.author?.id ?? null;
  const isMyPost = Boolean(currentUser?.id && postAuthorId && currentUser.id === postAuthorId);
  const canShowAuthorFollowButton = Boolean(currentUser?.id && postAuthorId && currentUser.id !== postAuthorId);
  const authorProfileBio = data?.author?.profileBio?.trim() ?? '';
  const authorProfileBioPreview = formatPostPreview(authorProfileBio);
  const authorSocialLinks = [
    {
      href: data?.author?.profileContactEmail?.trim() ? `mailto:${data.author.profileContactEmail.trim()}` : '',
      label: '이메일',
      icon: FiMail,
      external: false,
    },
    {
      href: data?.author?.profileGithubUrl?.trim() ?? '',
      label: '깃허브',
      icon: FiGithub,
      external: true,
    },
    {
      href: data?.author?.profileLinkedinUrl?.trim() ?? '',
      label: '링크드인',
      icon: FaLinkedinIn,
      external: true,
    },
    {
      href: data?.author?.profileTwitterUrl?.trim() ?? '',
      label: 'X',
      icon: FaXTwitter,
      external: true,
    },
    {
      href: data?.author?.profileFacebookUrl?.trim() ?? '',
      label: '페이스북',
      icon: FaFacebookF,
      external: true,
    },
    {
      href: data?.author?.profileWebsiteUrl?.trim() ?? '',
      label: '홈페이지',
      icon: FiGlobe,
      external: true,
    },
  ].filter(item => Boolean(item.href));
  const commentSkeletons = Array.from({ length: 3 });

  // 작성자 프로필 상태 동기화
  useEffect(() => {
    setIsAuthorFollowing(Boolean(data?.author?.isFollowing));
    setAuthorFollowerCount(data?.author?.followerCount ?? 0);
  }, [data?.author?.followerCount, data?.author?.id, data?.author?.isFollowing]);

  // 게시글 메뉴
  const handlePostMenuToggle = () => setIsPostMenuOpen(prev => !prev);
  const handlePostEdit = () => {
    if (!postId) return;
    window.location.href = `/posts/edit/${postId}`;
  };
  const handlePostDelete = async () => {
    if (!postId || isPostDeleting) return;
    const confirmed = window.confirm('게시글을 삭제할까요?');
    if (!confirmed) return;

    try {
      setIsPostDeleting(true);
      await postsApi.deletePost(postId);
      window.location.href = '/';
    } catch {
      showToast({ message: '게시글 삭제에 실패했습니다.', type: 'error' });
    } finally {
      setIsPostDeleting(false);
      setIsPostMenuOpen(false);
    }
  };

  // 작성자 팔로우
  const handleAuthorFollowToggle = async () => {
    if (!postAuthorId || isMyPost || isAuthorFollowLoading) return;
    if (!accessToken) {
      showToast({ message: LOGIN_MESSAGES.requireAuth, type: 'warning' });
      return;
    }

    try {
      setIsAuthorFollowLoading(true);
      const result = isAuthorFollowing
        ? await followsApi.unfollowUser(postAuthorId)
        : await followsApi.followUser(postAuthorId);

      setIsAuthorFollowing(result.following);
      setAuthorFollowerCount(prev => (result.following ? prev + 1 : Math.max(0, prev - 1)));
    } catch {
      showToast({ message: '팔로우 처리에 실패했습니다.', type: 'error' });
    } finally {
      setIsAuthorFollowLoading(false);
      setIsAuthorFollowHover(false);
    }
  };

  // 댓글 상태
  const {
    commentListRef,
    commentMentionQuery,
    commentMentionSuggestions,
    commentSort,
    commentTextareaRef,
    content,
    editingCommentId,
    editingContent,
    getFlattenedReplies,
    getReplyState,
    handleCommentBlur,
    handleCommentChange,
    handleCommentLikeToggle,
    handleCommentMenuToggle,
    handleCommentMentionSelect,
    handleCommentShare,
    handleCommentSortToggle,
    handleCommentSubmit,
    handleCommentBlock,
    handleCommentReport,
    handleDeleteComment,
    handleEditChange,
    handleEditCancel,
    handleEditStart,
    handleEditSubmit,
    handleFollowToggle,
    handleReplyBlur,
    handleReplyCompositionEnd,
    handleReplyCompositionStart,
    handleReplyInput,
    handleReplyMentionSelect,
    handleReplySubmit,
    handleReplyToggle,
    hasEditingLengthError,
    hasLengthError,
    isCommentsLoading,
    isSubmitting,
    isUpdating,
    getReplyMentionSuggestions,
    mentionRoleMap,
    openCommentMenuId,
    openRepliesIds,
    refetchComments,
    replyCountMap,
    setReplyFormRef,
    setReplyTextareaRef,
    shouldShowCommentMentions,
    syncReplyMentionQuery,
    topLevelComments,
  } = usePostDetailComments({
    accessToken,
    authorName: data?.author?.name,
    authorRole: data?.author?.role,
    isQueryEnabled,
    mentionClassName: styles.commentMentionInput,
    postId,
  });
  // 액션 핸들러
  const { handleShareCopy, handleLikeClick, previewContent, tocItems } = usePostDetailActions({ data, postId });
  const handleTocClick = createTocClickHandler();

  // 렌더 유틸
  const renderMentionLabel = (name: string, query: string | null) => {
    const segments = getMentionHighlightSegments(name, query);

    return (
      <span className={styles.commentMentionName}>
        {segments.map((segment, index) =>
          segment.type === 'match' ? (
            <span key={`${segment.value}-${index}`} className={styles.commentMentionMatch}>
              {segment.value}
            </span>
          ) : (
            <Fragment key={`${segment.value}-${index}`}>{segment.value}</Fragment>
          ),
        )}
      </span>
    );
  };
  const renderMentionRole = (name: string) => {
    const role = mentionRoleMap.get(name);
    return role ? <span className={styles.commentMentionRole}>{role}</span> : null;
  };

  // 토큰 갱신
  usePostDetailRefresh({
    accessToken,
    isInitialized,
    refetchComments,
    refetchPost: refetch,
  });

  const renderCommentItem = (
    comment: (typeof topLevelComments)[number],
    isReply = false,
    depth = 0,
    rootId?: string,
  ) => {
    const rootCommentId = rootId ?? comment.id;
    const replies = depth === 0 ? getFlattenedReplies(comment.id) : [];
    const canIndent = isReply;
    const shouldIndent = isReply && depth === 1;
    const replyCount = replyCountMap.get(comment.id) ?? 0;
    const isAuthor = Boolean(comment.author?.id && comment.author.id === postAuthorId);
    const replyIndentStyle = shouldIndent ? { marginLeft: 'calc(30px + 1rem)' } : undefined;
    const isRepliesOpen = openRepliesIds.includes(rootCommentId);
    const replyState = getReplyState(rootCommentId);
    const replyMentionList = getReplyMentionSuggestions(replyState.mentionQuery);
    const isReplyMentionOpen = replyMentionList.length > 0 && replyState.mentionQuery !== null;
    const hasReplyLengthError = isCommentContentTooLong(replyState.content);
    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={isReply ? styles.commentReply : styles.commentItem}
        style={replyIndentStyle}
      >
        <div className={canIndent ? `${styles.commentInner} ${styles.commentReplyInner}` : styles.commentInner}>
          {canIndent && (
            <span className={styles.commentReplyIcon} aria-hidden="true">
              <FiCornerDownRight />
            </span>
          )}
          <div className={styles.commentHeaderRow}>
            <div className={styles.commentProfile}>
              <div className={styles.commentAvatarGroup}>
                <span className={styles.commentAvatar} aria-hidden="true">
                  {comment.author?.profileImageUrl ? (
                    <Image
                      className={styles.commentAvatarImage}
                      src={comment.author.profileImageUrl}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                    />
                  ) : (
                    <FaUser />
                  )}
                </span>
                {isAuthor ? <span className={styles.commentAuthorText}>작성자</span> : null}
              </div>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>
                  {comment.author?.name ?? '익명'} {comment.author?.role ? formatRole(comment.author.role) : ''}
                </span>
                <span className={styles.commentDate}>
                  {formatDateTime(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt ? ' (수정됨)' : ''}
                  {comment.author?.followerCount ? ` · 팔로워 ${comment.author.followerCount}` : ''}
                </span>
              </div>
            </div>
            {comment.isOwner ? (
              <div className={styles.commentMoreWrapper}>
                <button
                  type="button"
                  className={styles.commentMoreButton}
                  aria-label="댓글 옵션"
                  onClick={() => handleCommentMenuToggle(comment.id)}
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
              <div className={styles.commentUserActions}>
                <div className={styles.commentMoreWrapper}>
                  <button
                    type="button"
                    className={styles.commentMoreButton}
                    aria-label="댓글 옵션"
                    onClick={() => handleCommentMenuToggle(comment.id)}
                  >
                    <FiMoreHorizontal aria-hidden="true" />
                  </button>
                  {openCommentMenuId === comment.id ? (
                    <div className={styles.commentMoreMenu} role="menu">
                      <button
                        type="button"
                        className={styles.commentMoreItem}
                        role="menuitem"
                        onClick={handleCommentBlock}
                      >
                        <FiSlash aria-hidden="true" />
                        차단
                      </button>
                      <button
                        type="button"
                        className={styles.commentMoreItem}
                        role="menuitem"
                        onClick={handleCommentReport}
                      >
                        <FiFlag aria-hidden="true" />
                        신고
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={
                    comment.author?.isFollowing
                      ? `${styles.commentFollowButton} ${styles.commentFollowButtonActive}`
                      : styles.commentFollowButton
                  }
                  onClick={() => handleFollowToggle(comment.author)}
                >
                  {comment.author?.isFollowing ? '팔로잉' : '팔로우'}
                </button>
              </div>
            )}
          </div>
          <div className={styles.commentContent}>
            {editingCommentId === comment.id ? (
              <div className={styles.commentEditForm}>
                <textarea
                  className={`${styles.commentTextarea} ${hasEditingLengthError ? styles.commentTextareaError : ''}`}
                  name="comment-edit"
                  value={editingContent}
                  onChange={handleEditChange}
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
              <p className={styles.commentBody}>
                {splitCommentMentions(comment.content).map((part, index) =>
                  part.type === 'mention' ? (
                    <span key={`${part.value}-${index}`} className={styles.commentMention}>
                      {part.value}
                    </span>
                  ) : (
                    <Fragment key={`${part.value}-${index}`}>{part.value}</Fragment>
                  ),
                )}
              </p>
            )}
            <div className={styles.commentFooter}>
              <button
                type="button"
                className={`${styles.commentActionButton} ${comment.liked ? styles.commentActionButtonLiked : ''}`}
                aria-label="좋아요"
                onClick={() => handleCommentLikeToggle(comment.id)}
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
                aria-label={isReply ? '답글 달기' : '댓글'}
                onClick={() => handleReplyToggle(rootCommentId, comment, isReply)}
              >
                {isReply ? (
                  <>
                    <FiCornerDownRight aria-hidden="true" />
                    <span>답글 달기</span>
                  </>
                ) : (
                  <>
                    <FiMessageCircle aria-hidden="true" />
                    {replyCount > 0 ? (
                      <span className={styles.commentActionValue}>
                        <NumberFlow value={replyCount} />
                      </span>
                    ) : null}
                  </>
                )}
              </button>
              {!isReply && (
                <button
                  type="button"
                  className={styles.commentActionButton}
                  aria-label="공유"
                  onClick={() => handleCommentShare(comment.id)}
                >
                  <FiShare2 aria-hidden="true" />
                </button>
              )}
            </div>
            {!isReply && isRepliesOpen && (
              <div className={styles.commentInlineReply} ref={setReplyFormRef(rootCommentId)}>
                <span className={styles.commentInlineIcon} aria-hidden="true">
                  <FiCornerDownRight />
                </span>
                <span className={styles.commentAvatar} aria-hidden="true">
                  {comment.author?.profileImageUrl ? (
                    <Image
                      className={styles.commentAvatarImage}
                      src={comment.author.profileImageUrl}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                    />
                  ) : (
                    <FaUser />
                  )}
                </span>
                <div className={styles.commentInlineBody}>
                  <div className={styles.commentTextareaWrapper}>
                    <div
                      className={`${styles.commentEditable} ${hasReplyLengthError ? styles.commentTextareaError : ''}`}
                      role="textbox"
                      aria-multiline="true"
                      aria-label="답글 입력"
                      data-placeholder={
                        accessToken ? '답글을 의견을 남겨보세요.' : '로그인 후 답글을 작성할 수 있어요.'
                      }
                      ref={setReplyTextareaRef(rootCommentId)}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleReplyInput(rootCommentId)}
                      onKeyUp={syncReplyMentionQuery(rootCommentId)}
                      onMouseUp={syncReplyMentionQuery(rootCommentId)}
                      onCompositionStart={handleReplyCompositionStart(rootCommentId)}
                      onCompositionEnd={handleReplyCompositionEnd(rootCommentId)}
                      onBlur={handleReplyBlur(rootCommentId)}
                    />
                    {isReplyMentionOpen ? (
                      <div className={styles.commentMentionList} role="listbox">
                        {replyMentionList.map(name => (
                          <button
                            key={name}
                            type="button"
                            role="option"
                            aria-selected="false"
                            className={styles.commentMentionItem}
                            onMouseDown={handleReplyMentionSelect(rootCommentId, name)}
                          >
                            <span className={styles.commentMentionAvatar} aria-hidden="true" />
                            <span className={styles.commentMentionTextGroup}>
                              {renderMentionLabel(name, replyState.mentionQuery)}
                            </span>
                            {renderMentionRole(name)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={
                        replyState.content.trim()
                          ? `${styles.commentInlineSubmit} ${styles.commentInlineSubmitActive}`
                          : styles.commentInlineSubmit
                      }
                      disabled={!replyState.content.trim() || hasReplyLengthError}
                      onClick={() => handleReplySubmit(rootCommentId)}
                    >
                      답글 등록
                    </button>
                  </div>
                  {hasReplyLengthError ? (
                    <div className={styles.commentInlineActions}>
                      <span className={styles.commentError}>1,000자까지 입력 가능해요.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
        {!isReply && isRepliesOpen && replies.length > 0 && (
          <div className={styles.commentRepliesContainer}>
            {replies.map(reply => (
              <Fragment key={reply.id}>{renderCommentItem(reply, true, depth + 1, rootCommentId)}</Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isInitialized || isLoading) {
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
            <div className={markdownStyles.markdown}>
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
        <div className={styles.categoryRow}>
          <div className={styles.category}>{data.category?.name ?? 'ALL'}</div>
          {isMyPost ? (
            <div className={styles.postMoreWrapper}>
              <button
                type="button"
                className={styles.postMoreButton}
                aria-label="게시글 옵션"
                onClick={handlePostMenuToggle}
              >
                <FiMoreHorizontal aria-hidden="true" />
              </button>
              {isPostMenuOpen ? (
                <div className={styles.postMoreMenu} role="menu">
                  <button type="button" className={styles.postMoreItem} role="menuitem" onClick={handlePostEdit}>
                    <FiEdit2 aria-hidden="true" />
                    수정
                  </button>
                  <button
                    type="button"
                    className={styles.postMoreItem}
                    role="menuitem"
                    disabled={isPostDeleting}
                    onClick={handlePostDelete}
                  >
                    <FiTrash2 aria-hidden="true" />
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
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
        {data.tags.length ? (
          <div className={styles.metaTagRow}>
            <CiShoppingTag className={styles.metaTagIcon} aria-hidden="true" />
            <div className={styles.metaTagList}>
              {data.tags.map(tag => (
                <span key={tag.id} className={styles.metaTagItem}>
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className={styles.headerDivider} aria-hidden="true" />

      <div className={styles.body}>
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
          <article className={markdownStyles.markdown} data-scroll-progress-end="post-content">
            {previewContent}
          </article>
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

          {data.author ? (
            <section
              className={`${styles.authorProfileCard} ${canShowAuthorFollowButton ? styles.authorProfileCardWithFollow : ''}`}
              aria-label="작성자 프로필"
            >
              <div className={styles.authorProfileMain}>
                <div className={styles.authorProfileAvatar} aria-hidden="true">
                  {data.author.profileImageUrl ? (
                    <Image
                      className={styles.authorProfileAvatarImage}
                      src={data.author.profileImageUrl}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                    />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div className={styles.authorProfileInfo}>
                  <div className={styles.authorProfileNameRow}>
                    {data.author.profileHandle ? (
                      <Link
                        className={styles.authorProfileNameLink}
                        href={`/@${data.author.profileHandle.replace(/^@/, '')}`}
                      >
                        <span className={styles.authorProfileName}>{data.author.name}</span>
                        <span className={`${styles.authorProfileRole} ${styles.authorProfileRoleLink}`}>
                          <span>{formatRole(data.author.role)}</span>
                          <FiExternalLink className={styles.authorProfileNameLinkIcon} aria-hidden="true" />
                        </span>
                      </Link>
                    ) : (
                      <>
                        <span className={styles.authorProfileName}>{data.author.name}</span>
                        <span className={styles.authorProfileRole}>{formatRole(data.author.role)}</span>
                      </>
                    )}
                  </div>
                  {authorProfileBioPreview ? (
                    <p className={styles.authorProfileBio}>{authorProfileBioPreview}</p>
                  ) : null}
                  <span className={styles.authorProfileMeta}>팔로워 {authorFollowerCount.toLocaleString()}</span>
                </div>
              </div>
              {canShowAuthorFollowButton ? (
                <button
                  type="button"
                  className={`${styles.authorFollowButton} ${isAuthorFollowing ? styles.authorFollowButtonActive : ''}`}
                  disabled={isAuthorFollowLoading || !postAuthorId}
                  onMouseEnter={() => setIsAuthorFollowHover(true)}
                  onMouseLeave={() => setIsAuthorFollowHover(false)}
                  onClick={handleAuthorFollowToggle}
                >
                  {isAuthorFollowing ? (isAuthorFollowHover ? '언팔로우' : '팔로잉') : '팔로우'}
                </button>
              ) : null}
              {authorSocialLinks.length ? (
                <>
                  <div className={styles.authorProfileSocialDivider} aria-hidden="true" />
                  <div className={styles.authorProfileSocialRow} aria-label="작성자 소셜 링크">
                    {authorSocialLinks.map(({ href, label, icon: Icon, external }) => (
                      <a
                        key={label}
                        className={styles.authorProfileSocialLink}
                        href={href}
                        aria-label={label}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noreferrer' : undefined}
                      >
                        <Icon aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

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
                handleCommentSubmit();
              }}
            >
              <div className={styles.commentTextareaWrapper}>
                <textarea
                  className={`${styles.commentTextarea} ${hasLengthError ? styles.commentTextareaError : ''}`}
                  name="comment"
                  placeholder={
                    accessToken
                      ? '허위사실, 욕설, 사칭 등 댓글은 통보 없이 삭제될 수 있으며, 커뮤니티 운영정책에 따라 추가 조치가 이루어질 수 있습니다.'
                      : '로그인 후 댓글을 작성할 수 있어요.'
                  }
                  ref={commentTextareaRef}
                  value={content}
                  onChange={handleCommentChange}
                  onBlur={handleCommentBlur}
                  disabled={!accessToken}
                />
                {shouldShowCommentMentions ? (
                  <div className={styles.commentMentionList} role="listbox">
                    {commentMentionSuggestions.map(name => (
                      <button
                        key={name}
                        type="button"
                        role="option"
                        aria-selected="false"
                        className={styles.commentMentionItem}
                        onMouseDown={handleCommentMentionSelect(name)}
                      >
                        <span className={styles.commentMentionAvatar} aria-hidden="true" />
                        <span className={styles.commentMentionTextGroup}>
                          {renderMentionLabel(name, commentMentionQuery)}
                        </span>
                        {renderMentionRole(name)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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
            <div className={styles.commentList} aria-live="polite" ref={commentListRef}>
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
              ) : topLevelComments.length > 0 ? (
                <>
                  <div className={styles.commentListHeader}>
                    <div className={styles.commentSortGroup} role="tablist" aria-label="댓글 정렬">
                      <button
                        type="button"
                        className={`${styles.commentSortButton} ${styles.commentSortActive}`}
                        onClick={handleCommentSortToggle}
                      >
                        {commentSort === 'popular' ? (
                          <>
                            <FiTrendingUp className={styles.commentSortIcon} aria-hidden="true" />
                            인기순
                          </>
                        ) : (
                          <>
                            <FiClock className={styles.commentSortIcon} aria-hidden="true" />
                            최신순
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {topLevelComments.map((comment, index) => (
                    <Fragment key={comment.id}>
                      {index > 0 && <div className={styles.commentDividerLine} />}
                      {renderCommentItem(comment, false, 0)}
                    </Fragment>
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
