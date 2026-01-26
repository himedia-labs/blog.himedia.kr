import { axiosInstance } from '@/app/shared/network/axios.instance';
import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  PostDetailResponse,
  PostLikeResponse,
  PostListQuery,
  PostListResponse,
  PostShareResponse,
  PostViewResponse,
  UpdatePostRequest,
  UpdatePostResponse,
} from '@/app/shared/types/post';

const getPosts = async (params?: PostListQuery): Promise<PostListResponse> => {
  const res = await axiosInstance.get<PostListResponse>('/posts', { params });
  return res.data;
};

// 게시물 생성
const createPost = async (payload: CreatePostRequest): Promise<CreatePostResponse> => {
  const res = await axiosInstance.post<CreatePostResponse>('/posts', payload);
  return res.data;
};

// 임시저장 목록 조회
const getDrafts = async (params?: PostListQuery): Promise<PostListResponse> => {
  const res = await axiosInstance.get<PostListResponse>('/posts/drafts', { params });
  return res.data;
};

// 임시저장 상세 조회
const getDraftDetail = async (postId: string): Promise<PostDetailResponse> => {
  const res = await axiosInstance.get<PostDetailResponse>(`/posts/drafts/${postId}`);
  return res.data;
};

// 게시물 상세 조회
const getPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  const res = await axiosInstance.get<PostDetailResponse>(`/posts/${postId}`);
  return res.data;
};

// 게시물 공유 카운트 증가
const sharePost = async (postId: string): Promise<PostShareResponse> => {
  const res = await axiosInstance.post<PostShareResponse>(`/posts/${postId}/share`);
  return res.data;
};

// 게시물 조회수 증가
const viewPost = async (postId: string): Promise<PostViewResponse> => {
  const res = await axiosInstance.post<PostViewResponse>(`/posts/${postId}/view`);
  return res.data;
};

// 게시물 좋아요 토글
const likePost = async (postId: string): Promise<PostLikeResponse> => {
  const res = await axiosInstance.post<PostLikeResponse>(`/posts/${postId}/like`);
  return res.data;
};

// 게시물 수정
const updatePost = async (payload: UpdatePostRequest): Promise<UpdatePostResponse> => {
  const { id, ...body } = payload;
  const res = await axiosInstance.patch<UpdatePostResponse>(`/posts/${id}`, body);
  return res.data;
};

// 게시물 삭제
const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  const res = await axiosInstance.delete<DeletePostResponse>(`/posts/${postId}`);
  return res.data;
};

export const postsApi = {
  getPosts,
  createPost,
  getDrafts,
  getDraftDetail,
  getPostDetail,
  sharePost,
  viewPost,
  likePost,
  updatePost,
  deletePost,
};
