'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CiCalendar } from 'react-icons/ci';
import { FiEdit2, FiEye, FiHeart, FiMessageCircle, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';

import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useMyCommentsQuery } from '@/app/api/comments/comments.queries';
import { useFollowersQuery, useFollowingsQuery } from '@/app/api/follows/follows.queries';
import { postsApi } from '@/app/api/posts/posts.api';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { usePostsQuery } from '@/app/api/posts/posts.queries';
import { useAuthStore } from '@/app/shared/store/authStore';
import { splitCommentMentions } from '@/app/(routes)/(public)/posts/[postId]/postDetail.utils';

import commentStyles from '@/app/(routes)/(public)/posts/[postId]/PostDetail.module.css';
import styles from './MyPage.module.css';

import type { ChangeEvent, MouseEvent } from 'react';

const formatDateLabel = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const formatSummary = (value?: string | null) => {
  if (!value) return '내용 없음';
  return value.replace(/\s+/g, ' ').slice(0, 120);
};

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

type TabKey = 'posts' | 'comments' | 'likes' | 'settings';

const getInitialTab = (value?: string | null, defaultTab: TabKey = 'posts') => {
  if (value === 'comments' || value === 'likes' || value === 'posts' || value === 'settings') return value;
  return defaultTab;
};

type MyPagePostsPanelProps = {
  defaultTab?: TabKey;
};

export default function MyPagePostsPanel({ defaultTab = 'posts' }: MyPagePostsPanelProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // 탭 상태
  const [activeList, setActiveList] = useState<TabKey>(getInitialTab(searchParams.get('tab'), defaultTab));
  const [editingContent, setEditingContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  // 인증 상태
  const { accessToken } = useAuthStore();

  // 데이터 조회
  const { data: currentUser } = useCurrentUserQuery();
  const { data: followersData } = useFollowersQuery({ enabled: Boolean(accessToken) });
  const { data: followingsData } = useFollowingsQuery({ enabled: Boolean(accessToken) });
  const { data: myCommentsData } = useMyCommentsQuery({ enabled: Boolean(accessToken) });
  const { data: postsData } = usePostsQuery(
    { sort: 'createdAt', order: 'DESC', limit: 30 },
    { enabled: Boolean(accessToken) },
  );

  // 파생 데이터
  const myComments = myCommentsData ?? [];
  const displayName = currentUser?.name ?? '사용자';
  const followerCount = followersData?.length ?? 0;
  const followingCount = followingsData?.length ?? 0;
  const myPosts = useMemo(() => {
    if (!postsData?.items?.length || !currentUser?.id) return [];
    return postsData.items.filter(item => item.author?.id === currentUser.id && item.status === 'PUBLISHED');
  }, [currentUser?.id, postsData?.items]);

  useEffect(() => {
    setActiveList(getInitialTab(searchParams.get('tab'), defaultTab));
  }, [defaultTab, searchParams]);

  const { mutateAsync: deleteMyComment, isPending: isDeleting } = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      commentsApi.deleteComment(postId, commentId),
  });
  const { mutateAsync: deleteMyPost, isPending: isPostDeleting } = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
  });
  const { mutateAsync: updateMyComment, isPending: isUpdating } = useMutation({
    mutationFn: ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      commentsApi.updateComment(postId, commentId, { content }),
  });

  const hasEditingLengthError = editingContent.length > 1000;
  const handleCommentMenuToggle = (commentId: string) =>
    setOpenCommentMenuId(prev => (prev === commentId ? null : commentId));
  const handleCommentMenuClose = () => setOpenCommentMenuId(null);
  const handleCommentMenuClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handlePostMenuToggle = (postId: string) => setOpenPostMenuId(prev => (prev === postId ? null : postId));
  const handlePostMenuClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handlePostEdit = (postId: string) => {
    window.location.href = `/posts/new?draftId=${postId}`;
  };
  const handlePostDelete = async (postId: string) => {
    const confirmed = window.confirm('게시글을 삭제할까요?');
    if (!confirmed) return;
    await deleteMyPost(postId);
    setOpenPostMenuId(null);
    await queryClient.invalidateQueries({ queryKey: postsKeys.all });
  };
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };
  const handleEditChange = (event: ChangeEvent<HTMLTextAreaElement>) => setEditingContent(event.target.value);
  const handleEditStart = (commentId: string, content: string) => {
    setEditingContent(content);
    setEditingCommentId(commentId);
    setOpenCommentMenuId(null);
  };
  const handleEditSubmit = async (postId: string, commentId: string) => {
    if (!postId) return;
    const trimmed = editingContent.trim();
    if (!trimmed || hasEditingLengthError) return;
    await updateMyComment({ postId, commentId, content: trimmed });
    handleEditCancel();
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
  };
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!postId) return;
    const confirmed = window.confirm('댓글을 삭제할까요?');
    if (!confirmed) return;
    await deleteMyComment({ postId, commentId });
    if (editingCommentId === commentId) {
      handleEditCancel();
    }
    setOpenCommentMenuId(null);
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
  };

  if (!accessToken) {
    return (
      <div className={styles.empty}>
        <p>로그인 후 이용해주세요.</p>
        <Link href="/login" className={styles.primaryLink}>
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.profileCard}>
          <div className={styles.profileMain}>
            <div className={styles.avatar} aria-hidden="true">
              <span className={styles.avatarText}>{displayName.charAt(0) ?? 'U'}</span>
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{displayName}</span>
              <div className={styles.profileStats}>
                <span className={styles.profileStat}>
                  글 <strong>{myPosts.length}</strong>
                </span>
                <span className={styles.profileDivider}>·</span>
                <span className={styles.profileStat}>
                  팔로워 <strong>{followerCount}</strong>
                </span>
                <span className={styles.profileDivider}>·</span>
                <span className={styles.profileStat}>
                  팔로잉 <strong>{followingCount}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className={styles.headerDivider} aria-hidden="true" />

      <div className={styles.content}>
        {activeList === 'settings' ? null : activeList === 'posts' ? (
          myPosts.length ? (
            <ul className={styles.listView}>
              {myPosts.map((post, index) => (
                <Fragment key={post.id}>
                  <li>
                    <Link className={styles.postLink} href={`/posts/${post.id}`}>
                      <article className={styles.listItem}>
                        <div className={styles.listBody}>
                          <div className={styles.listHeaderRow}>
                            <h3>{post.title || '제목 없음'}</h3>
                            <div className={styles.listMenuWrapper}>
                              <button
                                type="button"
                                className={styles.listMenuButton}
                                aria-label="게시글 옵션"
                                onClick={event => {
                                  handlePostMenuClick(event);
                                  handlePostMenuToggle(post.id);
                                }}
                              >
                                <FiMoreHorizontal aria-hidden="true" />
                              </button>
                              {openPostMenuId === post.id ? (
                                <div className={styles.listMenu} role="menu" onClick={handlePostMenuClick}>
                                  <button
                                    type="button"
                                    className={styles.listMenuItem}
                                    role="menuitem"
                                    onClick={event => {
                                      handlePostMenuClick(event);
                                      handlePostEdit(post.id);
                                    }}
                                  >
                                    <FiEdit2 aria-hidden="true" />
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.listMenuItem}
                                    role="menuitem"
                                    disabled={isPostDeleting}
                                    onClick={event => {
                                      handlePostMenuClick(event);
                                      handlePostDelete(post.id);
                                    }}
                                  >
                                    <FiTrash2 aria-hidden="true" />
                                    삭제
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <p className={styles.summary}>{formatSummary(post.content)}</p>
                          <div className={styles.meta}>
                            <span className={styles.metaGroup}>
                              <span className={styles.metaItem}>
                                <CiCalendar aria-hidden="true" /> {formatDateLabel(post.publishedAt ?? post.createdAt)}
                              </span>
                            </span>
                            <span className={styles.metaGroup}>
                              <span className={styles.metaItem}>
                                <FiEye aria-hidden="true" /> {post.viewCount.toLocaleString()}
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
                        {post.thumbnailUrl ? (
                          <div
                            className={styles.listThumb}
                            style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
                            aria-hidden="true"
                          />
                        ) : null}
                      </article>
                    </Link>
                  </li>
                  {index < myPosts.length - 1 ? (
                    <li className={styles.listDividerItem} aria-hidden="true">
                      <div className={styles.listDivider} />
                    </li>
                  ) : null}
                </Fragment>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>아직 작성한 게시물이 없습니다.</div>
          )
        ) : activeList === 'comments' ? (
          myComments.length ? (
            <div className={`${commentStyles.commentList} ${styles.commentListReset}`}>
              {myComments.map((comment, index) => {
                const postId = comment.post?.id ?? '';
                const postTitle = comment.post?.title ?? '게시글 없음';
                const commentLink = postId ? `/posts/${postId}#comment-${comment.id}` : '';
                const commentDate = formatDateTimeLabel(comment.createdAt);
                const isEditing = editingCommentId === comment.id;
                const isLinkEnabled = Boolean(commentLink) && !isEditing;

                return (
                  <Fragment key={comment.id}>
                    {index > 0 ? <div className={commentStyles.commentDividerLine} /> : null}
                    {isLinkEnabled ? (
                      <Link className={styles.commentLink} href={commentLink}>
                        <div className={commentStyles.commentItem} id={`comment-${comment.id}`}>
                          <div className={commentStyles.commentInner}>
                            <div className={commentStyles.commentHeaderRow}>
                              <div className={commentStyles.commentProfile}>
                                <div className={commentStyles.commentAvatarGroup}>
                                  <span className={commentStyles.commentAvatar} aria-hidden="true" />
                                </div>
                                <div className={commentStyles.commentMeta}>
                                  <span className={commentStyles.commentAuthor}>‘{postTitle}’에 남긴 글</span>
                                  <span className={commentStyles.commentDate}>{commentDate}</span>
                                </div>
                              </div>
                              <div className={commentStyles.commentMoreWrapper}>
                                <button
                                  type="button"
                                  className={commentStyles.commentMoreButton}
                                  aria-label="댓글 옵션"
                                  onClick={event => {
                                    handleCommentMenuClick(event);
                                    handleCommentMenuToggle(comment.id);
                                  }}
                                >
                                  <FiMoreHorizontal aria-hidden="true" />
                                </button>
                                {openCommentMenuId === comment.id ? (
                                  <div
                                    className={commentStyles.commentMoreMenu}
                                    role="menu"
                                    onClick={handleCommentMenuClick}
                                  >
                                    <button
                                      type="button"
                                      className={commentStyles.commentMoreItem}
                                      role="menuitem"
                                      onClick={event => {
                                        handleCommentMenuClick(event);
                                        handleEditStart(comment.id, comment.content);
                                      }}
                                    >
                                      <FiEdit2 aria-hidden="true" />
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      className={commentStyles.commentMoreItem}
                                      role="menuitem"
                                      disabled={isDeleting}
                                      onClick={event => {
                                        handleCommentMenuClick(event);
                                        handleDeleteComment(postId, comment.id);
                                      }}
                                    >
                                      <FiTrash2 aria-hidden="true" />
                                      삭제
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className={commentStyles.commentContent}>
                              {isEditing ? (
                                <div className={commentStyles.commentEditForm} onClick={handleCommentMenuClick}>
                                  <textarea
                                    className={`${commentStyles.commentTextarea} ${
                                      hasEditingLengthError ? commentStyles.commentTextareaError : ''
                                    }`}
                                    name="comment-edit"
                                    value={editingContent}
                                    onChange={handleEditChange}
                                  />
                                  <div className={commentStyles.commentEditActions}>
                                    {hasEditingLengthError ? (
                                      <span className={commentStyles.commentError}>1,000자까지 입력 가능해요.</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      className={commentStyles.commentCancelButton}
                                      onClick={handleEditCancel}
                                      disabled={isUpdating}
                                    >
                                      취소
                                    </button>
                                    <button
                                      type="button"
                                      className={
                                        editingContent.trim()
                                          ? `${commentStyles.commentButton} ${commentStyles.commentButtonActive}`
                                          : commentStyles.commentButton
                                      }
                                      disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                                      onClick={() => handleEditSubmit(postId, comment.id)}
                                    >
                                      수정 완료
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className={commentStyles.commentBody}>
                                  {splitCommentMentions(comment.content).map((part, partIndex) =>
                                    part.type === 'mention' ? (
                                      <span key={`${part.value}-${partIndex}`} className={commentStyles.commentMention}>
                                        {part.value}
                                      </span>
                                    ) : (
                                      <Fragment key={`${part.value}-${partIndex}`}>{part.value}</Fragment>
                                    ),
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className={commentStyles.commentItem} id={`comment-${comment.id}`}>
                        <div className={commentStyles.commentInner}>
                          <div className={commentStyles.commentHeaderRow}>
                            <div className={commentStyles.commentProfile}>
                              <div className={commentStyles.commentAvatarGroup}>
                                <span className={commentStyles.commentAvatar} aria-hidden="true" />
                              </div>
                              <div className={commentStyles.commentMeta}>
                                <span className={commentStyles.commentAuthor}>‘{postTitle}’에 남긴 글</span>
                                <span className={commentStyles.commentDate}>{commentDate}</span>
                              </div>
                            </div>
                            <div className={commentStyles.commentMoreWrapper}>
                              <button
                                type="button"
                                className={commentStyles.commentMoreButton}
                                aria-label="댓글 옵션"
                                onClick={event => {
                                  handleCommentMenuClick(event);
                                  handleCommentMenuToggle(comment.id);
                                }}
                              >
                                <FiMoreHorizontal aria-hidden="true" />
                              </button>
                              {openCommentMenuId === comment.id ? (
                                <div
                                  className={commentStyles.commentMoreMenu}
                                  role="menu"
                                  onClick={handleCommentMenuClick}
                                >
                                  <button
                                    type="button"
                                    className={commentStyles.commentMoreItem}
                                    role="menuitem"
                                    onClick={event => {
                                      handleCommentMenuClick(event);
                                      handleEditStart(comment.id, comment.content);
                                    }}
                                  >
                                    <FiEdit2 aria-hidden="true" />
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    className={commentStyles.commentMoreItem}
                                    role="menuitem"
                                    disabled={isDeleting}
                                    onClick={event => {
                                      handleCommentMenuClick(event);
                                      handleDeleteComment(postId, comment.id);
                                    }}
                                  >
                                    <FiTrash2 aria-hidden="true" />
                                    삭제
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className={commentStyles.commentContent}>
                            {isEditing ? (
                              <div className={commentStyles.commentEditForm} onClick={handleCommentMenuClick}>
                                <textarea
                                  className={`${commentStyles.commentTextarea} ${
                                    hasEditingLengthError ? commentStyles.commentTextareaError : ''
                                  }`}
                                  name="comment-edit"
                                  value={editingContent}
                                  onChange={handleEditChange}
                                />
                                <div className={commentStyles.commentEditActions}>
                                  {hasEditingLengthError ? (
                                    <span className={commentStyles.commentError}>1,000자까지 입력 가능해요.</span>
                                  ) : null}
                                  <button
                                    type="button"
                                    className={commentStyles.commentCancelButton}
                                    onClick={handleEditCancel}
                                    disabled={isUpdating}
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    className={
                                      editingContent.trim()
                                        ? `${commentStyles.commentButton} ${commentStyles.commentButtonActive}`
                                        : commentStyles.commentButton
                                    }
                                    disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                                    onClick={() => handleEditSubmit(postId, comment.id)}
                                  >
                                    수정 완료
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={commentStyles.commentBody}>
                                {splitCommentMentions(comment.content).map((part, partIndex) =>
                                  part.type === 'mention' ? (
                                    <span key={`${part.value}-${partIndex}`} className={commentStyles.commentMention}>
                                      {part.value}
                                    </span>
                                  ) : (
                                    <Fragment key={`${part.value}-${partIndex}`}>{part.value}</Fragment>
                                  ),
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>아직 남긴 댓글이 없습니다.</div>
          )
        ) : (
          <div className={styles.empty}>아직 활동 내역이 없습니다.</div>
        )}
      </div>
    </>
  );
}
