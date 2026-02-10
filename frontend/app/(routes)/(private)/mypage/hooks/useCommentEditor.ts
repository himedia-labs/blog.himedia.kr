import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import {
  isCommentContentTooLong,
  MAX_COMMENT_CONTENT_LENGTH,
  normalizeCommentContent,
  sanitizeCommentContent,
} from '@/app/shared/utils/comment.utils';

import type { ChangeEvent } from 'react';

/**
 * 마이페이지 댓글 편집 훅
 * @description 내 댓글 수정/삭제 상태를 관리
 */
export const useCommentEditor = () => {
  // 편집 상태
  const queryClient = useQueryClient();

  const [editingContent, setEditingContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);

  // 댓글 삭제 뮤테이션
  const { mutateAsync: deleteMyComment, isPending: isDeleting } = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      commentsApi.deleteComment(postId, commentId),
  });

  // 댓글 수정 뮤테이션
  const { mutateAsync: updateMyComment, isPending: isUpdating } = useMutation({
    mutationFn: ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      commentsApi.updateComment(postId, commentId, { content }),
  });

  // 댓글 길이 체크
  const hasEditingLengthError = isCommentContentTooLong(editingContent);

  // 댓글 메뉴 토글
  const handleCommentMenuToggle = (commentId: string) =>
    setOpenCommentMenuId(prev => (prev === commentId ? null : commentId));

  // 댓글 편집 취소
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // 댓글 편집 입력
  const handleEditChange = (event: ChangeEvent<HTMLTextAreaElement>) => setEditingContent(event.target.value);

  // 댓글 편집 시작
  const handleEditStart = (commentId: string, content: string) => {
    setEditingContent(content);
    setEditingCommentId(commentId);
    setOpenCommentMenuId(null);
  };

  // 댓글 편집 저장
  const handleEditSubmit = async (postId: string, commentId: string) => {
    if (!postId) return;
    const normalized = normalizeCommentContent(editingContent);
    if (normalized !== editingContent) {
      setEditingContent(normalized);
    }
    const trimmed = sanitizeCommentContent(normalized);
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_CONTENT_LENGTH) return;
    await updateMyComment({ postId, commentId, content: trimmed });
    handleEditCancel();
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
  };

  // 댓글 삭제
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

  return {
    editingCommentId,
    editingContent,
    hasEditingLengthError,
    isDeleting,
    isUpdating,
    openCommentMenuId,
    handleCommentMenuToggle,
    handleDeleteComment,
    handleEditCancel,
    handleEditChange,
    handleEditStart,
    handleEditSubmit,
  };
};
