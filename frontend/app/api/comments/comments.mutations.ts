import { useMutation } from '@tanstack/react-query';

import { commentsApi } from './comments.api';
import type {
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentResponse,
  ToggleCommentLikeResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
} from '@/app/shared/types/comment';

// 댓글 생성
export const useCreateCommentMutation = (postId: string) => {
  return useMutation<CreateCommentResponse, Error, CreateCommentRequest>({
    mutationFn: payload => commentsApi.createComment(postId, payload),
  });
};

// 댓글 좋아요 토글
export const useToggleCommentLikeMutation = (postId: string, commentId: string) => {
  return useMutation<ToggleCommentLikeResponse, Error, void>({
    mutationFn: () => commentsApi.toggleCommentLike(postId, commentId),
  });
};

// 댓글 수정
export const useUpdateCommentMutation = (postId: string) => {
  return useMutation<UpdateCommentResponse, Error, { commentId: string; payload: UpdateCommentRequest }>({
    mutationFn: ({ commentId, payload }) => commentsApi.updateComment(postId, commentId, payload),
  });
};

// 댓글 삭제
export const useDeleteCommentMutation = (postId: string) => {
  return useMutation<DeleteCommentResponse, Error, string>({
    mutationFn: commentId => commentsApi.deleteComment(postId, commentId),
  });
};
