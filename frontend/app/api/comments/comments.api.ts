import { axiosInstance } from '@/app/shared/network/axios.instance';

import type {
  CommentListResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentResponse,
  MyCommentListResponse,
  ToggleCommentLikeResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
} from '@/app/shared/types/comment';

// 댓글 목록 조회
const getComments = async (postId: string): Promise<CommentListResponse> => {
  const res = await axiosInstance.get<CommentListResponse>(`/posts/${postId}/comments`);
  return res.data;
};

// 댓글 생성
const createComment = async (postId: string, payload: CreateCommentRequest): Promise<CreateCommentResponse> => {
  const res = await axiosInstance.post<CreateCommentResponse>(`/posts/${postId}/comments`, payload);
  return res.data;
};

// 댓글 좋아요 토글
const toggleCommentLike = async (postId: string, commentId: string): Promise<ToggleCommentLikeResponse> => {
  const res = await axiosInstance.post<ToggleCommentLikeResponse>(`/posts/${postId}/comments/${commentId}/like`);
  return res.data;
};

// 댓글 수정
const updateComment = async (
  postId: string,
  commentId: string,
  payload: UpdateCommentRequest,
): Promise<UpdateCommentResponse> => {
  const res = await axiosInstance.patch<UpdateCommentResponse>(`/posts/${postId}/comments/${commentId}`, payload);
  return res.data;
};

// 댓글 삭제
const deleteComment = async (postId: string, commentId: string): Promise<DeleteCommentResponse> => {
  const res = await axiosInstance.delete<DeleteCommentResponse>(`/posts/${postId}/comments/${commentId}`);
  return res.data;
};

// 내 댓글 목록 조회
const getMyComments = async (): Promise<MyCommentListResponse> => {
  const res = await axiosInstance.get<MyCommentListResponse>('/comments/me');
  return res.data;
};

export const commentsApi = {
  getComments,
  createComment,
  toggleCommentLike,
  updateComment,
  deleteComment,
  getMyComments,
};
