import { type ChangeEvent, useRef } from 'react';

import { useToast } from '@/app/shared/components/toast/toast';
import { useUploadThumbnailMutation } from '@/app/api/uploads/uploads.mutations';
import { useAuthStore } from '@/app/shared/store/authStore';
import {
  THUMBNAIL_MAX_SIZE,
  TOAST_THUMBNAIL_UPLOAD_FAILURE_MESSAGE,
  TOAST_THUMBNAIL_UPLOAD_SIZE_MESSAGE,
  TOAST_THUMBNAIL_UPLOAD_SUCCESS_MESSAGE,
  TOAST_THUMBNAIL_UPLOAD_TYPE_MESSAGE,
} from '@/app/shared/constants/limits/postCreate.limit';

import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/app/shared/types/error';

// 썸네일 업로드 관리 hook
export const useThumbnailUpload = (onUploadSuccess: (url: string) => void) => {
  const { showToast } = useToast();
  const { accessToken } = useAuthStore();
  const uploadThumbnailMutation = useUploadThumbnailMutation();
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const isAuthenticated = !!accessToken;
  const isThumbnailUploading = uploadThumbnailMutation.isPending;

  const handleThumbnailFileClick = () => {
    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    thumbnailInputRef.current?.click();
  };

  const handleThumbnailFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_TYPE_MESSAGE, type: 'warning' });
      return;
    }

    if (file.size > THUMBNAIL_MAX_SIZE) {
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_SIZE_MESSAGE, type: 'warning' });
      return;
    }

    if (uploadThumbnailMutation.isPending) return;

    try {
      const response = await uploadThumbnailMutation.mutateAsync(file);
      onUploadSuccess(response.url);
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_SUCCESS_MESSAGE, type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_THUMBNAIL_UPLOAD_FAILURE_MESSAGE;
      showToast({ message, type: 'error' });
    }
  };

  return {
    refs: {
      thumbnailInputRef,
    },
    state: {
      isThumbnailUploading,
    },
    handlers: {
      handleThumbnailFileClick,
      handleThumbnailFileSelect,
    },
  };
};
