import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useCreateCommentMutation } from '@/app/api/comments/comments.mutations';
import { postsKeys } from '@/app/api/posts/posts.keys';

const MAX_CONTENT_LENGTH = 1000;

export const usePostCommentForm = (postId: string) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const hasLengthError = content.length > MAX_CONTENT_LENGTH;
  const { mutateAsync, isPending } = useCreateCommentMutation(postId);

  const handleSubmit = useCallback(async () => {
    if (!postId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    if (hasLengthError) return;

    await mutateAsync({ content: trimmed });
    setContent('');
    await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
    await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
  }, [content, hasLengthError, mutateAsync, postId, queryClient]);

  return {
    content,
    hasLengthError,
    isSubmitting: isPending,
    setContent,
    handleSubmit,
  };
};
