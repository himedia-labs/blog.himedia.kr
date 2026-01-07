import { axiosInstance } from '@/app/shared/network/axios.instance';
import type {
  CreatePostRequest,
  CreatePostResponse,
  PostDetailResponse,
  PostListQuery,
  PostListResponse,
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

// 게시물 수정
const updatePost = async (payload: UpdatePostRequest): Promise<UpdatePostResponse> => {
  const { id, ...body } = payload;
  const res = await axiosInstance.patch<UpdatePostResponse>(`/posts/${id}`, body);
  return res.data;
};

export const postsApi = {
  getPosts,
  createPost,
  getDrafts,
  getDraftDetail,
  updatePost,
};
