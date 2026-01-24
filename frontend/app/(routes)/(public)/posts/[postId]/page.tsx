'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import NumberFlow from '@number-flow/react';
import { FaHeart } from 'react-icons/fa';
import {
  FiCornerDownRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiFlag,
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
  FiSlash,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import { useQueryClient } from '@tanstack/react-query';

import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useDeleteCommentMutation, useUpdateCommentMutation } from '@/app/api/comments/comments.mutations';
import { usePostCommentsQuery } from '@/app/api/comments/comments.queries';
import { followsApi } from '@/app/api/follows/follows.api';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';
import { usePostCommentForm } from './postDetail.comments.hooks';
import { usePostDetailActions } from './postDetail.hooks';
import { formatDate, formatDateTime, formatRole, splitCommentMentions } from './postDetail.utils';

import styles from './PostDetail.module.css';
import 'react-loading-skeleton/dist/skeleton.css';

import type { ChangeEvent, MouseEvent } from 'react';
import type { CommentListResponse } from '@/app/shared/types/comment';

const mentionQueryPattern = /(?:^|\s)@([A-Za-z0-9_가-힣]*)$/;

const getMentionQuery = (value: string, caretIndex: number) => {
  const slice = value.slice(0, caretIndex).replace(/\u00a0/g, ' ');
  const match = slice.match(mentionQueryPattern);
  if (!match) return null;
  return match[1] ?? '';
};

const getMentionStartIndex = (value: string, caretIndex: number) => {
  const slice = value.slice(0, caretIndex).replace(/\u00a0/g, ' ');
  const match = slice.match(mentionQueryPattern);
  if (!match) return null;
  return slice.lastIndexOf('@');
};

const filterMentionCandidates = (candidates: string[], query: string | null) => {
  if (query === null) return [];
  if (!query) return candidates;
  const normalized = query.toLowerCase();
  return candidates.filter(name => name.toLowerCase().includes(normalized));
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, match => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return escapeMap[match] ?? match;
  });

const renderMentionHtml = (value: string, mentionClass: string, allowList?: Set<string>, preserveSpaces = false) =>
  splitCommentMentions(value)
    .map(part => {
      const escaped = escapeHtml(part.value).replace(/\n/g, '<br>');
      const normalized = preserveSpaces ? escaped.replace(/ /g, '&nbsp;') : escaped;

      if (part.type === 'mention') {
        if (!allowList || allowList.has(part.value)) {
          return `<span class="${mentionClass}">${normalized}</span>`;
        }
        return normalized;
      }

      return normalized;
    })
    .join('');

const ensureMentionSpacing = (value: string, allowList: Set<string>, caretIndex: number) => {
  const mentionPattern = /@[A-Za-z0-9_가-힣]+/g;
  const normalizedValue = value.replace(/\u00a0/g, ' ');
  let lastIndex = 0;
  let caretOffset = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(normalizedValue)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const nextChar = normalizedValue[endIndex] ?? '';

    result += normalizedValue.slice(lastIndex, endIndex);

    if (allowList.has(match[0]) && (nextChar === '' || !/\s/.test(nextChar))) {
      result += ' ';
      if (endIndex < caretIndex) {
        caretOffset += 1;
      }
    }

    lastIndex = endIndex;
  }

  result += normalizedValue.slice(lastIndex);

  return { value: result, caretIndex: caretIndex + caretOffset };
};

const getCaretIndex = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return element.innerText.length;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.endContainer)) return element.innerText.length;

  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
};

const setCaretIndex = (element: HTMLElement, index: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentIndex = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length ?? 0;
    const nextIndex = currentIndex + nodeLength;
    if (index <= nextIndex) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, index - currentIndex));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentIndex = nextIndex;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const resizeReplyInput = (element: HTMLDivElement | null) => {
  if (!element) return;
  element.style.height = '40px';
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
};

const getMentionHighlightSegments = (name: string, query: string | null) => {
  if (!query) return [{ type: 'text', value: name }];
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const matchIndex = normalizedName.indexOf(normalizedQuery);
  if (matchIndex === -1) return [{ type: 'text', value: name }];

  const matchEnd = matchIndex + query.length;
  return [
    { type: 'text', value: name.slice(0, matchIndex) },
    { type: 'match', value: name.slice(matchIndex, matchEnd) },
    { type: 'text', value: name.slice(matchEnd) },
  ];
};

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

  // 입력 ref
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentListRef = useRef<HTMLDivElement | null>(null);
  const replyFormRefs = useRef(new Map<string, HTMLDivElement | null>());
  const replyTextareaRefs = useRef(new Map<string, HTMLDivElement | null>());
  const replyComposingRef = useRef(new Set<string>());
  const replyMentionQueryRef = useRef(new Map<string, string | null>());

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);

  // 요청 훅
  const isQueryEnabled = Boolean(postId) && isInitialized;
  const { data, isLoading, isError, refetch } = usePostDetailQuery(postId, { enabled: isQueryEnabled });
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = usePostCommentsQuery(postId, {
    enabled: isQueryEnabled,
  });
  const { content, handleSubmit, hasLengthError, isSubmitting, setContent } = usePostCommentForm(postId);

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
  const [openRepliesIds, setOpenRepliesIds] = useState<string[]>([]);
  const [replyStates, setReplyStates] = useState<
    Record<string, { content: string; parentId: string | null; mentionQuery: string | null }>
  >({});
  const [hasScrolledToHash, setHasScrolledToHash] = useState(false);
  const [commentMentionQuery, setCommentMentionQuery] = useState<string | null>(null);
  const hasEditingLengthError = editingContent.length > 1000;
  const topLevelComments = useMemo(() => {
    if (!comments?.length) return [];
    const topLevel = comments.filter(comment => !comment.parentId);

    if (commentSort === 'popular') {
      return topLevel.sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [commentSort, comments]);

  const replyCountMap = useMemo(() => {
    const countMap = new Map<string, number>();

    comments?.forEach(comment => {
      if (!comment.parentId) return;
      countMap.set(comment.parentId, (countMap.get(comment.parentId) ?? 0) + 1);
    });

    return countMap;
  }, [comments]);

  const getReplies = (parentId: string) => {
    if (!comments) return [];
    const replies = comments.filter(comment => comment.parentId === parentId);

    return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const getFlattenedReplies = (parentId: string) => {
    if (!comments) return [];
    const bucket: CommentListResponse = [];

    const collectReplies = (currentId: string) => {
      const directReplies = getReplies(currentId);

      directReplies.forEach(reply => {
        bucket.push(reply);
        collectReplies(reply.id);
      });
    };

    collectReplies(parentId);
    return bucket;
  };

  // 멘션 데이터
  const mentionCandidates = useMemo(() => {
    const candidates = new Set<string>();

    if (data?.author?.name) {
      candidates.add(data.author.name);
    }

    comments?.forEach(comment => {
      if (comment.author?.name) {
        candidates.add(comment.author.name);
      }
    });

    return Array.from(candidates);
  }, [comments, data?.author?.name]);
  const commentMentionSuggestions = useMemo(
    () => filterMentionCandidates(mentionCandidates, commentMentionQuery),
    [commentMentionQuery, mentionCandidates],
  );
  const shouldShowCommentMentions = commentMentionSuggestions.length > 0 && commentMentionQuery !== null;
  const mentionAllowList = useMemo(() => new Set(mentionCandidates.map(name => `@${name}`)), [mentionCandidates]);
  const getReplyState = (rootId: string) => replyStates[rootId] ?? { content: '', parentId: null, mentionQuery: null };
  const updateReplyState = (
    rootId: string,
    partial: Partial<{ content: string; parentId: string | null; mentionQuery: string | null }>,
  ) => {
    setReplyStates(prev => ({
      ...prev,
      [rootId]: { content: '', parentId: null, mentionQuery: null, ...prev[rootId], ...partial },
    }));
  };
  const setReplyTextareaRef = (rootId: string) => (node: HTMLDivElement | null) => {
    replyTextareaRefs.current.set(rootId, node);
  };
  const setReplyFormRef = (rootId: string) => (node: HTMLDivElement | null) => {
    replyFormRefs.current.set(rootId, node);
  };

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
  const handleReplyInput = (rootId: string) => () => {
    const target = replyTextareaRefs.current.get(rootId);
    if (!target) return;
    const caretIndex = getCaretIndex(target);
    const nextValue = target.textContent ?? '';
    const sliceValue = nextValue.slice(0, caretIndex);
    const nextQuery = getMentionQuery(nextValue, caretIndex);
    const hasAtSymbol = sliceValue.includes('@');

    updateReplyState(rootId, { content: nextValue });
    if (nextQuery !== null) {
      replyMentionQueryRef.current.set(rootId, nextQuery);
      updateReplyState(rootId, { mentionQuery: nextQuery });
    } else if (replyComposingRef.current.has(rootId) && hasAtSymbol) {
      updateReplyState(rootId, { mentionQuery: replyMentionQueryRef.current.get(rootId) ?? null });
    } else {
      replyMentionQueryRef.current.set(rootId, null);
      updateReplyState(rootId, { mentionQuery: null });
    }

    if (replyComposingRef.current.has(rootId)) return;
    const normalized = ensureMentionSpacing(nextValue, mentionAllowList, caretIndex);
    if (normalized.value !== nextValue) {
      updateReplyState(rootId, {
        content: normalized.value,
        mentionQuery: getMentionQuery(normalized.value, normalized.caretIndex),
      });
    }
    requestAnimationFrame(() => {
      const textarea = replyTextareaRefs.current.get(rootId);
      if (!textarea) return;
      const nextHtml = renderMentionHtml(normalized.value, styles.commentMentionInput, mentionAllowList, true);
      if (textarea.innerHTML === nextHtml) return;
      textarea.innerHTML = nextHtml;
      setCaretIndex(textarea, normalized.caretIndex);
      resizeReplyInput(textarea);
    });
  };
  const syncReplyMentionQuery = (rootId: string) => () => {
    const target = replyTextareaRefs.current.get(rootId);
    if (!target) return;
    if (replyComposingRef.current.has(rootId)) return;
    const caretIndex = getCaretIndex(target);
    const nextValue = target.textContent ?? '';
    const sliceValue = nextValue.slice(0, caretIndex);
    const nextQuery = getMentionQuery(nextValue, caretIndex);
    const hasAtSymbol = sliceValue.includes('@');

    updateReplyState(rootId, { content: nextValue });
    if (nextQuery !== null) {
      replyMentionQueryRef.current.set(rootId, nextQuery);
      updateReplyState(rootId, { mentionQuery: nextQuery });
    } else if (replyComposingRef.current.has(rootId) && hasAtSymbol) {
      updateReplyState(rootId, { mentionQuery: replyMentionQueryRef.current.get(rootId) ?? null });
    } else {
      replyMentionQueryRef.current.set(rootId, null);
      updateReplyState(rootId, { mentionQuery: null });
    }
    resizeReplyInput(target);
  };
  const handleReplyCompositionStart = (rootId: string) => () => {
    replyComposingRef.current.add(rootId);
  };
  const handleReplyCompositionEnd = (rootId: string) => () => {
    replyComposingRef.current.delete(rootId);
    requestAnimationFrame(handleReplyInput(rootId));
  };
  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.target;
    const nextValue = target.value;
    const caretIndex = target.selectionStart ?? nextValue.length;

    setContent(nextValue);
    setCommentMentionQuery(getMentionQuery(nextValue, caretIndex));
    if (!nextValue) {
      setCommentMentionQuery(null);
    }
  };
  const handleCommentMentionSelect = (name: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const textarea = commentTextareaRef.current;
    const caretIndex = textarea?.selectionStart ?? content.length;
    const mentionStartIndex = getMentionStartIndex(content, caretIndex);
    if (mentionStartIndex === null) return;

    const nextValue = `${content.slice(0, mentionStartIndex)}@${name} ${content.slice(caretIndex)}`;
    const nextCaretIndex = mentionStartIndex + name.length + 2;

    setContent(nextValue);
    setCommentMentionQuery(null);

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCaretIndex, nextCaretIndex);
    });
  };
  const handleReplyMentionSelect = (rootId: string, name: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const textarea = replyTextareaRefs.current.get(rootId);
    if (!textarea) return;
    const caretIndex = getCaretIndex(textarea);
    const replyState = getReplyState(rootId);
    const mentionStartIndex = getMentionStartIndex(replyState.content, caretIndex);
    if (mentionStartIndex === null) return;

    const nextValue = `${replyState.content.slice(0, mentionStartIndex)}@${name} ${replyState.content.slice(
      caretIndex,
    )}`;
    const nextCaretIndex = mentionStartIndex + name.length + 2;
    const normalized = ensureMentionSpacing(nextValue, mentionAllowList, nextCaretIndex);

    updateReplyState(rootId, { content: normalized.value, mentionQuery: null });

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.innerHTML = renderMentionHtml(normalized.value, styles.commentMentionInput, mentionAllowList, true);
      setCaretIndex(textarea, normalized.caretIndex);
      resizeReplyInput(textarea);
    });
  };
  const handleCommentBlur = () => setCommentMentionQuery(null);
  const handleReplyBlur = (rootId: string) => () => updateReplyState(rootId, { mentionQuery: null });
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
  const handleReplySubmit = async (rootId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    const replyState = getReplyState(rootId);
    const parentId = replyState.parentId ?? rootId;
    const trimmed = replyState.content.trim();
    if (!trimmed) {
      showToast({ message: '댓글을 입력해주세요.', type: 'warning' });
      return;
    }
    if (trimmed.length > 1000) {
      showToast({ message: '1,000자까지 입력 가능해요.', type: 'warning' });
      return;
    }

    try {
      await commentsApi.createComment(postId, { content: trimmed, parentId });
      updateReplyState(rootId, { content: '', parentId: parentId, mentionQuery: null });
      replyMentionQueryRef.current.delete(rootId);
      replyComposingRef.current.delete(rootId);
      requestAnimationFrame(() => {
        const textarea = replyTextareaRefs.current.get(rootId);
        if (!textarea) return;
        textarea.innerHTML = '';
        resizeReplyInput(textarea);
      });
      await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
      showToast({ message: '답글이 등록되었습니다.', type: 'success' });
      requestAnimationFrame(() => {
        const target = document.getElementById(`comment-${parentId}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch {
      showToast({ message: '답글 등록에 실패했습니다.', type: 'error' });
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
    if (hasScrolledToHash) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#comment-')) return;

    const timer = setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [comments, hasScrolledToHash, isCommentsLoading]);

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
    const replyIndentStyle = shouldIndent ? { marginLeft: 'calc(30px + 1rem)' } : undefined;
    const isRepliesOpen = openRepliesIds.includes(rootCommentId);
    const replyState = getReplyState(rootCommentId);
    const replyMentionList = filterMentionCandidates(mentionCandidates, replyState.mentionQuery);
    const isReplyMentionOpen = replyMentionList.length > 0 && replyState.mentionQuery !== null;
    const hasReplyLengthError = replyState.content.length > 1000;
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
              <span className={styles.commentAvatar} aria-hidden="true" />
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>
                  {comment.author?.name ?? '익명'} {comment.author?.role ? formatRole(comment.author.role) : ''}
                  {comment.author?.id && comment.author.id === postAuthorId ? ' (작성자)' : ''}
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
                  onClick={() => setOpenCommentMenuId(prev => (prev === comment.id ? null : comment.id))}
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
                    onClick={() => setOpenCommentMenuId(prev => (prev === comment.id ? null : comment.id))}
                  >
                    <FiMoreHorizontal aria-hidden="true" />
                  </button>
                  {openCommentMenuId === comment.id ? (
                    <div className={styles.commentMoreMenu} role="menu">
                      <button
                        type="button"
                        className={styles.commentMoreItem}
                        role="menuitem"
                        onClick={() => showToast({ message: '차단 기능은 준비중입니다.', type: 'info' })}
                      >
                        <FiSlash aria-hidden="true" />
                        차단
                      </button>
                      <button
                        type="button"
                        className={styles.commentMoreItem}
                        role="menuitem"
                        onClick={() => showToast({ message: '신고 기능은 준비중입니다.', type: 'info' })}
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
                  onClick={async () => {
                    if (!accessToken) {
                      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
                      return;
                    }
                    if (!comment.author?.id) {
                      showToast({ message: '사용자 정보를 확인할 수 없어요.', type: 'warning' });
                      return;
                    }
                    try {
                      if (comment.author.isFollowing) {
                        await followsApi.unfollowUser(comment.author.id);
                        showToast({ message: '팔로우를 취소했어요.', type: 'success' });
                      } else {
                        await followsApi.followUser(comment.author.id);
                        showToast({ message: '팔로우했습니다.', type: 'success' });
                      }
                      await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
                    } catch {
                      showToast({ message: '팔로우 처리에 실패했습니다.', type: 'error' });
                    }
                  }}
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
                aria-label={isReply ? '답글 달기' : '댓글'}
                onClick={() => {
                  if (!accessToken) {
                    showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
                    return;
                  }
                  if (isReply) {
                    if (!openRepliesIds.includes(rootCommentId)) {
                      setOpenRepliesIds(prev => [...prev, rootCommentId]);
                    }
                    const mentionName = comment.author?.name ? `@${comment.author.name} ` : '';
                    updateReplyState(rootCommentId, { parentId: comment.id, content: mentionName, mentionQuery: null });
                    requestAnimationFrame(() => {
                      replyFormRefs.current.get(rootCommentId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const target = replyTextareaRefs.current.get(rootCommentId);
                      if (!target) return;
                      target.innerHTML = renderMentionHtml(
                        mentionName,
                        styles.commentMentionInput,
                        mentionAllowList,
                        true,
                      );
                      setCaretIndex(target, mentionName.length);
                      resizeReplyInput(target);
                      target.focus();
                    });
                    return;
                  }
                  setOpenRepliesIds(prev => {
                    const isOpen = prev.includes(rootCommentId);
                    if (isOpen) {
                      updateReplyState(rootCommentId, { content: '', parentId: null, mentionQuery: null });
                      replyMentionQueryRef.current.delete(rootCommentId);
                      replyComposingRef.current.delete(rootCommentId);
                      return prev.filter(id => id !== rootCommentId);
                    }
                    updateReplyState(rootCommentId, { parentId: comment.id });
                    return [...prev, rootCommentId];
                  });
                  requestAnimationFrame(() => {
                    replyFormRefs.current.get(rootCommentId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const target = replyTextareaRefs.current.get(rootCommentId);
                    if (!target) return;
                    const nextValue = replyState.content;
                    target.innerHTML = renderMentionHtml(nextValue, styles.commentMentionInput, mentionAllowList, true);
                    setCaretIndex(target, nextValue.length);
                    resizeReplyInput(target);
                    target.focus();
                  });
                }}
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
              )}
            </div>
            {!isReply && isRepliesOpen && (
              <div className={styles.commentInlineReply} ref={setReplyFormRef(rootCommentId)}>
                <span className={styles.commentInlineIcon} aria-hidden="true">
                  <FiCornerDownRight />
                </span>
                <span className={styles.commentAvatar} aria-hidden="true" />
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
                            className={styles.commentMentionItem}
                            onMouseDown={handleReplyMentionSelect(rootCommentId, name)}
                          >
                            <span className={styles.commentMentionAvatar} aria-hidden="true" />
                            {renderMentionLabel(name, replyState.mentionQuery)}
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
                handleSubmit()
                  .then(isSuccess => {
                    if (!isSuccess) {
                      if (content.trim() && !hasLengthError) {
                        showToast({ message: '댓글 등록에 실패했습니다.', type: 'error' });
                      }
                      return;
                    }
                    showToast({ message: '댓글이 등록되었습니다.', type: 'success' });
                    requestAnimationFrame(() => {
                      commentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  })
                  .catch(() => null);
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
                        className={styles.commentMentionItem}
                        onMouseDown={handleCommentMentionSelect(name)}
                      >
                        <span className={styles.commentMentionAvatar} aria-hidden="true" />
                        {renderMentionLabel(name, commentMentionQuery)}
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
                        onClick={() => setCommentSort(prev => (prev === 'popular' ? 'latest' : 'popular'))}
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
