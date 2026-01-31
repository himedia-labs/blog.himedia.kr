import { useMutation } from '@tanstack/react-query';

import { postsApi } from '@/app/api/posts/posts.api';

import type {
  CreatePostRequest,
  CreatePostResponse,
  PostLikeResponse,
  PostShareResponse,
  PostViewResponse,
  UpdatePostRequest,
  UpdatePostResponse,
} from '@/app/shared/types/post';

// 게시물 생성
export const useCreatePostMutation = () => {
  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: postsApi.createPost,
  });
};

// 게시물 수정
export const useUpdatePostMutation = () => {
  return useMutation<UpdatePostResponse, Error, UpdatePostRequest>({
    mutationFn: postsApi.updatePost,
  });
};

// 게시물 공유 카운트 증가
export const useSharePostMutation = () => {
  return useMutation<PostShareResponse, Error, string>({
    mutationFn: postsApi.sharePost,
  });
};

// 게시물 조회수 증가
export const useViewPostMutation = () => {
  return useMutation<PostViewResponse, Error, string>({
    mutationFn: postsApi.viewPost,
  });
};

// 게시물 좋아요 토글
export const useLikePostMutation = () => {
  return useMutation<PostLikeResponse, Error, string>({
    mutationFn: postsApi.likePost,
  });
};
