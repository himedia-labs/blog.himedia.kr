import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { postsKeys } from '@/app/api/posts/posts.keys';
import { buildPostPayload } from '@/app/api/posts/posts.payload';
import { useToast } from '@/app/shared/components/toast/toast';
import { useCreatePostMutation, useUpdatePostMutation } from '@/app/api/posts/posts.mutations';
import {
  TOAST_CATEGORY_REQUIRED_MESSAGE,
  TOAST_CONTENT_REQUIRED_MESSAGE,
  TOAST_DRAFT_SAVED_MESSAGE,
  TOAST_SAVE_FAILURE_MESSAGE,
  TOAST_SAVE_SUCCESS_MESSAGE,
  TOAST_TITLE_REQUIRED_MESSAGE,
} from '@/app/shared/constants/messages/postCreate.message';
import { DRAFT_TOAST_DURATION_MS } from '@/app/shared/constants/limits/postCreate.limit';

import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { DraftSaveOptions, DraftSaverParams } from '@/app/shared/types/post';

/**
 * 임시저장 및 발행
 * @description 게시물 임시저장/발행 처리와 유효성 검증을 담당
 */
export const useDraftSaver = ({ formData, draftId, isAuthenticated }: DraftSaverParams) => {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();

  // 공통 validation
  const getValidatedFormData = () => ({
    tags: formData.tags,
    title: formData.title.trim(),
    content: formData.content.trim(),
    thumbnail: formData.thumbnailUrl.trim(),
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

  // 에러 핸들링
  const handleApiError = (error: unknown) => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message ?? TOAST_SAVE_FAILURE_MESSAGE;
    showToast({ message, type: 'error' });
  };

  // 임시저장
  const saveDraft = async (options?: DraftSaveOptions) => {
    const silent = options?.silent ?? false;
    const validated = getValidatedFormData();
    const hasDraftInput = Boolean(
      validated.title || validated.content || validated.categoryId || validated.thumbnail || validated.tags.length > 0,
    );

    if (!hasDraftInput) {
      if (!silent) {
        showToast({ message: '입력한 내용이 없습니다.', type: 'warning' });
      }
      return;
    }

    if (!isAuthenticated) {
      if (!silent) {
        showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      }
      return;
    }

    if (createPostMutation.isPending || updatePostMutation.isPending) return;

    try {
      const payload = buildPostPayload(
        {
          tags: validated.tags,
          title: validated.title,
          content: validated.content,
          categoryId: validated.categoryId,
          thumbnailUrl: validated.thumbnail,
        },
        'DRAFT',
        { includeEmptyThumbnail: Boolean(draftId) },
      );

      let savedDraftId = draftId;
      if (draftId) {
        await updatePostMutation.mutateAsync({ id: draftId, ...payload });
      } else {
        const response = await createPostMutation.mutateAsync(payload);
        savedDraftId = response.id;
        router.replace(`/posts/new?draftId=${response.id}`);
      }

      queryClient.invalidateQueries({ queryKey: postsKeys.drafts(), exact: false });
      if (savedDraftId) {
        queryClient.invalidateQueries({ queryKey: postsKeys.draft(savedDraftId) });
      }
      showToast({ message: TOAST_DRAFT_SAVED_MESSAGE, type: 'success', duration: DRAFT_TOAST_DURATION_MS });
    } catch (error) {
      handleApiError(error);
    }
  };

  // 게시물 발행
  const publishPost = async () => {
    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    const validated = getValidatedFormData();
    if (!validatePublishRequirements(validated)) return;

    if (createPostMutation.isPending || updatePostMutation.isPending) return;

    try {
      const payload = buildPostPayload(
        {
          tags: validated.tags,
          title: validated.title,
          content: validated.content,
          categoryId: validated.categoryId,
          thumbnailUrl: validated.thumbnail,
        },
        'PUBLISHED',
        { includeEmptyThumbnail: Boolean(draftId) },
      );

      if (draftId) {
        await updatePostMutation.mutateAsync({ id: draftId, ...payload });
      } else {
        await createPostMutation.mutateAsync(payload);
      }

      showToast({ message: TOAST_SAVE_SUCCESS_MESSAGE, type: 'success' });
      router.replace('/');
    } catch (error) {
      handleApiError(error);
    }
  };

  return {
    saveDraft,
    publishPost,
  };
};
