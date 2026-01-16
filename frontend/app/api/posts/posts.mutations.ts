import { useMutation } from '@tanstack/react-query';

import { postsApi } from './posts.api';
import type {
  CreatePostRequest,
  CreatePostResponse,
  PostShareResponse,
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
