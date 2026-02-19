import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { postsKeys } from '@/app/api/posts/posts.keys';
import { buildPostPayload } from '@/app/api/posts/posts.payload';
import { useUpdatePostMutation } from '@/app/api/posts/posts.mutations';

import { useToast } from '@/app/shared/components/toast/toast';
import {
  TOAST_CATEGORY_REQUIRED_MESSAGE,
  TOAST_CONTENT_REQUIRED_MESSAGE,
  TOAST_SAVE_FAILURE_MESSAGE,
  TOAST_SAVE_SUCCESS_MESSAGE,
  TOAST_TITLE_REQUIRED_MESSAGE,
} from '@/app/shared/constants/messages/post.message';

import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { PostEditSaverParams } from '@/app/shared/types/postEdit';

/**
 * 게시물 수정 저장 훅
 * @description 수정 저장과 유효성 검증을 관리
 */
export const usePostEditSaver = ({ postId, formData }: PostEditSaverParams) => {
  // 공통 훅
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const updatePostMutation = useUpdatePostMutation();

  // 입력값 정리
  const getValidatedFormData = () => ({
    tags: formData.tags,
    title: formData.title.trim(),
    content: formData.content.trim(),
    categoryId: formData.categoryId,
  });

  // 발행 필수 항목 검증
  const validatePublishRequirements = (validated: ReturnType<typeof getValidatedFormData>) => {
    if (!validated.title) {
      showToast({ message: TOAST_TITLE_REQUIRED_MESSAGE, type: 'warning' });
      return false;
    }
    if (!validated.categoryId) {
      showToast({ message: TOAST_CATEGORY_REQUIRED_MESSAGE, type: 'warning' });
      return false;
    }
    if (!validated.content) {
      showToast({ message: TOAST_CONTENT_REQUIRED_MESSAGE, type: 'warning' });
      return false;
    }
    return true;
  };

  // 에러 처리
  const handleApiError = (error: unknown) => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message ?? TOAST_SAVE_FAILURE_MESSAGE;
    showToast({ message, type: 'error' });
  };

  // 게시물 수정 저장
  const handlePostUpdate = async () => {
    if (!postId) return;
    if (updatePostMutation.isPending) return;

    const validated = getValidatedFormData();
    if (!validatePublishRequirements(validated)) return;

    try {
      const payload = buildPostPayload(
        {
          tags: validated.tags,
          title: validated.title,
          content: validated.content,
          categoryId: validated.categoryId,
        },
        'PUBLISHED',
      );

      await updatePostMutation.mutateAsync({ id: postId, ...payload });
      await queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
      await queryClient.invalidateQueries({ queryKey: postsKeys.list(), exact: false });
      showToast({ message: TOAST_SAVE_SUCCESS_MESSAGE, type: 'success' });
      router.replace(`/posts/${postId}`);
    } catch (error) {
      handleApiError(error);
    }
  };

  return {
    isUpdating: updatePostMutation.isPending,
    handlePostUpdate,
  };
};
