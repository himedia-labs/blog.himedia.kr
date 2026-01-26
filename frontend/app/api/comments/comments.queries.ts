import { useQuery } from '@tanstack/react-query';

import { commentsApi } from './comments.api';
import { commentsKeys } from './comments.keys';
import type { CommentListResponse, MyCommentListResponse } from '@/app/shared/types/comment';

type QueryOptions = {
  enabled?: boolean;
};

export const usePostCommentsQuery = (postId?: string, options?: QueryOptions) => {
  return useQuery<CommentListResponse, Error>({
    queryKey: commentsKeys.list(postId),
    queryFn: () => commentsApi.getComments(postId ?? ''),
    enabled: Boolean(postId) && (options?.enabled ?? true),
  });
};

export const useMyCommentsQuery = (options?: QueryOptions) => {
  return useQuery<MyCommentListResponse, Error>({
    queryKey: commentsKeys.myList(),
    queryFn: () => commentsApi.getMyComments(),
    enabled: options?.enabled ?? true,
  });
};
