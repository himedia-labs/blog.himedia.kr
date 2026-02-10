import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import { usePostCommentsQuery } from '@/app/api/comments/comments.queries';
import { useDeleteCommentMutation, useUpdateCommentMutation } from '@/app/api/comments/comments.mutations';
import { followsApi } from '@/app/api/follows/follows.api';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { useToast } from '@/app/shared/components/toast/toast';
import {
  isCommentContentTooLong,
  MAX_COMMENT_CONTENT_LENGTH,
  normalizeCommentContent,
  sanitizeCommentContent,
} from '@/app/shared/utils/comment.utils';

import { usePostCommentForm } from '@/app/(routes)/(public)/posts/[postId]/hooks/usePostCommentForm';
import {
  copyToClipboard,
  ensureMentionSpacing,
  filterMentionCandidates,
  formatRole,
  getCaretIndex,
  getMentionQuery,
  getMentionStartIndex,
  renderMentionHtml,
  resizeReplyInput,
  setCaretIndex,
} from '@/app/(routes)/(public)/posts/[postId]/utils';

import type { ChangeEvent, MouseEvent } from 'react';
import type { CommentItem, CommentListResponse } from '@/app/shared/types/comment';
import type { UserRole } from '@/app/shared/types/post';

type UsePostDetailCommentsParams = {
  accessToken: string | null;
  authorName?: string | null;
  authorRole?: UserRole | null;
  isQueryEnabled: boolean;
  mentionClassName: string;
  postId: string;
};

/**
 * 댓글 상태 훅
 * @description 댓글/답글 상태와 멘션 입력을 관리
 */
export const usePostDetailComments = ({
  accessToken,
  authorName,
  authorRole,
  isQueryEnabled,
  mentionClassName,
  postId,
}: UsePostDetailCommentsParams) => {
  // 입력 ref
  const commentListRef = useRef<HTMLDivElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyFormRefs = useRef(new Map<string, HTMLDivElement | null>());
  const replyTextareaRefs = useRef(new Map<string, HTMLDivElement | null>());
  const replyComposingRef = useRef(new Set<string>());
  const replyMentionQueryRef = useRef(new Map<string, string | null>());
  const hasScrolledToHashRef = useRef(false);

  // 요청 훅
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = usePostCommentsQuery(postId, {
    enabled: isQueryEnabled,
  });
  const { content, handleSubmit, hasLengthError, isSubmitting, setContent } = usePostCommentForm(postId);
  const { mutateAsync: deleteComment } = useDeleteCommentMutation(postId);
  const { mutateAsync: updateComment, isPending: isUpdating } = useUpdateCommentMutation(postId);

  // 상태
  const [commentSort, setCommentSort] = useState<'popular' | 'latest'>('latest');
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [openRepliesIds, setOpenRepliesIds] = useState<string[]>([]);
  const [replyStates, setReplyStates] = useState<
    Record<string, { content: string; parentId: string | null; mentionQuery: string | null }>
  >({});
  const [commentMentionQuery, setCommentMentionQuery] = useState<string | null>(null);
  const hasEditingLengthError = isCommentContentTooLong(editingContent);

  // 멘션 후보
  const mentionCandidates = useMemo(() => {
    const candidates = new Set<string>();

    if (authorName) {
      candidates.add(authorName);
    }

    comments?.forEach(comment => {
      if (comment.author?.name) {
        candidates.add(comment.author.name);
      }
    });

    return Array.from(candidates);
  }, [authorName, comments]);

  // 멘션 역할 맵
  const mentionRoleMap = useMemo(() => {
    const roleMap = new Map<string, string>();

    if (authorName && authorRole) {
      roleMap.set(authorName, formatRole(authorRole));
    }

    comments?.forEach(comment => {
      if (!comment.author?.name || !comment.author?.role) return;
      if (!roleMap.has(comment.author.name)) {
        roleMap.set(comment.author.name, formatRole(comment.author.role));
      }
    });

    return roleMap;
  }, [authorName, authorRole, comments]);

  // 멘션 제안
  const commentMentionSuggestions = useMemo(
    () => filterMentionCandidates(mentionCandidates, commentMentionQuery),
    [commentMentionQuery, mentionCandidates],
  );

  // 답글 멘션 제안
  const getReplyMentionSuggestions = useCallback(
    (query: string | null) => filterMentionCandidates(mentionCandidates, query),
    [mentionCandidates],
  );

  // 멘션 허용 목록
  const mentionAllowList = useMemo(() => new Set(mentionCandidates.map(name => `@${name}`)), [mentionCandidates]);

  // 멘션 노출 조건
  const shouldShowCommentMentions = commentMentionSuggestions.length > 0 && commentMentionQuery !== null;

  // 댓글 정렬
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

  // 답글 개수
  const replyCountMap = useMemo(() => {
    const countMap = new Map<string, number>();

    comments?.forEach(comment => {
      if (!comment.parentId) return;
      countMap.set(comment.parentId, (countMap.get(comment.parentId) ?? 0) + 1);
    });

    return countMap;
  }, [comments]);

  // 답글 상태 유틸
  const getReplyState = (rootId: string) => replyStates[rootId] ?? { content: '', parentId: null, mentionQuery: null };
  const updateReplyState = (
    rootId: string,
    partial: Partial<{ content: string; parentId: string | null; mentionQuery: string | null }>,
  ) => {
    setReplyStates(prev => {
      const baseState = prev[rootId] ?? { content: '', parentId: null, mentionQuery: null };
      return {
        ...prev,
        [rootId]: { ...baseState, ...partial },
      };
    });
  };

  // 답글 조회
  const getReplies = (parentId: string) => {
    if (!comments) return [];
    const replies = comments.filter(comment => comment.parentId === parentId);

    return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // 답글 평탄화
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

  // 답글 입력 ref
  const setReplyFormRef = (rootId: string) => (node: HTMLDivElement | null) => {
    replyFormRefs.current.set(rootId, node);
  };
  const setReplyTextareaRef = (rootId: string) => (node: HTMLDivElement | null) => {
    replyTextareaRefs.current.set(rootId, node);
  };

  // 댓글 입력
  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.target;
    const nextValue = target.value;
    const caretIndex = target.selectionStart ?? nextValue.length;
    const nextQuery = getMentionQuery(nextValue, caretIndex);

    setContent(nextValue);
    setCommentMentionQuery(nextQuery);
    if (!nextValue) {
      setCommentMentionQuery(null);
    }
  };

  // 댓글 멘션 선택
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

  // 댓글 입력 종료
  const handleCommentBlur = () => setCommentMentionQuery(null);

  // 댓글 메뉴 토글
  const handleCommentMenuToggle = (commentId: string) =>
    setOpenCommentMenuId(prev => (prev === commentId ? null : commentId));

  // 댓글 정렬 토글
  const handleCommentSortToggle = () => setCommentSort(prev => (prev === 'popular' ? 'latest' : 'popular'));

  // 댓글 수정 입력
  const handleEditChange = (event: ChangeEvent<HTMLTextAreaElement>) => setEditingContent(event.target.value);

  // 댓글 등록
  const handleCommentSubmit = async () => {
    const normalized = normalizeCommentContent(content);
    if (normalized !== content) {
      setContent(normalized);
    }
    const isSuccess = await handleSubmit(normalized);
    if (!isSuccess) {
      if (content.trim() && !hasLengthError) {
        showToast({ message: '댓글 등록에 실패했습니다.', type: 'error' });
      }
      return;
    }
    showToast({ message: '댓글이 등록되었습니다.', type: 'success' });
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
    requestAnimationFrame(() => {
      commentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // 댓글 삭제
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
      await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    } catch {
      showToast({ message: '댓글 삭제에 실패했습니다.', type: 'error' });
    }
  };

  // 댓글 수정 시작
  const handleEditStart = (commentId: string, nextContent: string) => {
    setEditingCommentId(commentId);
    setEditingContent(nextContent);
    setOpenCommentMenuId(null);
  };

  // 댓글 수정 취소
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // 댓글 수정 완료
  const handleEditSubmit = async (commentId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    const normalized = normalizeCommentContent(editingContent);
    if (normalized !== editingContent) {
      setEditingContent(normalized);
    }
    const trimmed = sanitizeCommentContent(normalized);
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
      await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    } catch {
      showToast({ message: '댓글 수정에 실패했습니다.', type: 'error' });
    }
  };

  // 댓글 좋아요
  const handleCommentLikeToggle = async (commentId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    try {
      const result = await commentsApi.toggleCommentLike(postId, commentId);
      queryClient.setQueryData(commentsKeys.list(postId), (old: CommentListResponse | undefined) => {
        if (!old) return old;
        return old.map(commentItem =>
          commentItem.id === commentId
            ? { ...commentItem, likeCount: result.likeCount, liked: result.liked }
            : commentItem,
        );
      });
    } catch {
      // 에러 무시
    }
  };

  // 댓글 팔로우
  const handleFollowToggle = async (author: CommentItem['author']) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    if (!author?.id) {
      showToast({ message: '사용자 정보를 확인할 수 없어요.', type: 'warning' });
      return;
    }
    try {
      if (author.isFollowing) {
        await followsApi.unfollowUser(author.id);
        showToast({ message: '팔로우를 취소했어요.', type: 'success' });
      } else {
        await followsApi.followUser(author.id);
        showToast({ message: '팔로우했습니다.', type: 'success' });
      }
      await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
    } catch {
      showToast({ message: '팔로우 처리에 실패했습니다.', type: 'error' });
    }
  };

  // 댓글 링크 복사
  const handleCommentShare = async (commentId: string) => {
    const commentUrl = `${window.location.origin}/posts/${postId}#comment-${commentId}`;
    try {
      await copyToClipboard(commentUrl);
      showToast({ message: '링크가 복사되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '링크 복사에 실패했습니다.', type: 'error' });
    }
  };

  // 댓글 사용자 처리
  const handleCommentBlock = () => showToast({ message: '차단 기능은 준비중입니다.', type: 'info' });
  const handleCommentReport = () => showToast({ message: '신고 기능은 준비중입니다.', type: 'info' });

  // 답글 입력
  const handleReplyInput = (rootId: string) => () => {
    if (replyComposingRef.current.has(rootId)) return;
    const target = replyTextareaRefs.current.get(rootId);
    if (!target) return;
    const caretIndex = getCaretIndex(target);
    const nextValue = (target.innerText ?? '').replace(/\u00a0/g, ' ');
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
      const mentionMatches = normalized.value.match(/@[A-Za-z0-9_가-힣]+/g) ?? [];
      const hasAllowedMention = mentionMatches.some(match => mentionAllowList.has(match));
      if (!hasAllowedMention) {
        resizeReplyInput(textarea);
        return;
      }
      const nextHtml = renderMentionHtml(normalized.value, mentionClassName, mentionAllowList, true);
      if (textarea.innerHTML !== nextHtml) {
        textarea.innerHTML = nextHtml;
        setCaretIndex(textarea, normalized.caretIndex);
      }
      resizeReplyInput(textarea);
    });
  };

  // 답글 커서 동기화
  const syncReplyMentionQuery = (rootId: string) => () => {
    const target = replyTextareaRefs.current.get(rootId);
    if (!target) return;
    if (replyComposingRef.current.has(rootId)) return;
    const caretIndex = getCaretIndex(target);
    const nextValue = (target.innerText ?? '').replace(/\u00a0/g, ' ');
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

  // 답글 조합 입력
  const handleReplyCompositionStart = (rootId: string) => () => {
    replyComposingRef.current.add(rootId);
  };
  const handleReplyCompositionEnd = (rootId: string) => () => {
    replyComposingRef.current.delete(rootId);
    requestAnimationFrame(handleReplyInput(rootId));
  };

  // 답글 멘션 선택
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
      textarea.innerHTML = renderMentionHtml(normalized.value, mentionClassName, mentionAllowList, true);
      setCaretIndex(textarea, normalized.caretIndex);
      resizeReplyInput(textarea);
    });
  };

  // 답글 입력 종료
  const handleReplyBlur = (rootId: string) => () => updateReplyState(rootId, { mentionQuery: null });

  // 답글 등록
  const handleReplySubmit = async (rootId: string) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    const replyState = getReplyState(rootId);
    const parentId = replyState.parentId ?? rootId;
    const trimmed = sanitizeCommentContent(replyState.content);
    if (!trimmed) {
      showToast({ message: '댓글을 입력해주세요.', type: 'warning' });
      return;
    }
    if (trimmed.length > MAX_COMMENT_CONTENT_LENGTH) {
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

  // 답글 토글
  const handleReplyToggle = (rootCommentId: string, comment: CommentItem, isReply: boolean) => {
    if (!accessToken) return;
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
        target.innerHTML = renderMentionHtml(mentionName, mentionClassName, mentionAllowList, true);
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
      const nextValue = getReplyState(rootCommentId).content;
      target.innerHTML = renderMentionHtml(nextValue, mentionClassName, mentionAllowList, true);
      setCaretIndex(target, nextValue.length);
      resizeReplyInput(target);
      target.focus();
    });
  };

  // 댓글 해시 스크롤
  useEffect(() => {
    if (!comments || isCommentsLoading) return;
    if (hasScrolledToHashRef.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#comment-')) return;
    hasScrolledToHashRef.current = true;

    const timer = setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [comments, isCommentsLoading]);

  return {
    commentListRef,
    commentMentionQuery,
    commentMentionSuggestions,
    commentSort,
    commentTextareaRef,
    comments,
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
    content,
    hasLengthError,
    hasEditingLengthError,
  };
};
