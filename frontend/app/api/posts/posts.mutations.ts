import { useMutation } from '@tanstack/react-query';

import { postsApi } from './posts.api';
import type { CreatePostRequest, CreatePostResponse, UpdatePostRequest, UpdatePostResponse } from '@/app/shared/types/post';

// 게시물 생성 뮤테이션
export const useCreatePostMutation = () => {
  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: postsApi.createPost,
  });
};

// 게시물 수정 뮤테이션
export const useUpdatePostMutation = () => {
  return useMutation<UpdatePostResponse, Error, UpdatePostRequest>({
    mutationFn: postsApi.updatePost,
  });
};
