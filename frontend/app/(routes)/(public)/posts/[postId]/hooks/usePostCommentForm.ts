import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useCreateCommentMutation } from '@/app/api/comments/comments.mutations';
import { postsKeys } from '@/app/api/posts/posts.keys';
import {
  isCommentContentTooLong,
  MAX_COMMENT_CONTENT_LENGTH,
  sanitizeCommentContent,
} from '@/app/shared/utils/comment.utils';

/**
 * 게시물 댓글 작성 훅
 * @description 댓글 작성 입력과 등록 상태를 관리
 */
export const usePostCommentForm = (postId: string) => {
  // 댓글 작성 상태
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const hasLengthError = isCommentContentTooLong(content);
  const { mutateAsync, isPending } = useCreateCommentMutation(postId);

  // 댓글 등록 처리
  const handleSubmit = useCallback(
    async (overrideContent?: string) => {
      const currentContent = overrideContent ?? content;
      if (!postId) return false;
      const trimmed = sanitizeCommentContent(currentContent);
      if (!trimmed) return false;
      if (trimmed.length > MAX_COMMENT_CONTENT_LENGTH) return false;

      try {
        await mutateAsync({ content: trimmed });
        setContent('');
        await queryClient.invalidateQueries({ queryKey: commentsKeys.list(postId) });
        await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
        return true;
      } catch {
        return false;
      }
    },
    [content, mutateAsync, postId, queryClient],
  );

  return {
    content,
    hasLengthError,
    isSubmitting: isPending,
    setContent,
    handleSubmit,
  };
};
