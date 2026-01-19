import { useRef } from 'react';

import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';
import { useUploadImageMutation } from '@/app/api/uploads/uploads.mutations';
import { THUMBNAIL_MAX_SIZE } from '@/app/shared/constants/limits/postCreate.limit';
import {
  TOAST_IMAGE_UPLOAD_FAILURE_MESSAGE,
  TOAST_IMAGE_UPLOAD_SIZE_MESSAGE,
  TOAST_IMAGE_UPLOAD_SUCCESS_MESSAGE,
  TOAST_IMAGE_UPLOAD_TYPE_MESSAGE,
} from '@/app/shared/constants/messages/postCreate.message';

import type { AxiosError } from 'axios';
import type { ChangeEvent, ClipboardEvent } from 'react';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import type { MarkdownImageUploadParams, SelectionRange } from '@/app/shared/types/post';

/**
 * 마크다운 이미지 업로드
 * @description 에디터 이미지 선택/붙여넣기, 업로드, 마크다운 삽입을 처리
 */
export const useMarkdownImageUpload = (params: MarkdownImageUploadParams) => {
  const { content, contentRef, setContentValue, setContentAndSelection } = params;
  const { showToast } = useToast();
  const { accessToken } = useAuthStore();
  const uploadImageMutation = useUploadImageMutation();
  const selectionRef = useRef<SelectionRange | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // 커서 선택 범위 저장
  const captureSelection = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    selectionRef.current = {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    };
  };

  // 커서 선택 범위 조회
  const getSelectionRange = () => {
    if (selectionRef.current) {
      const range = selectionRef.current;
      selectionRef.current = null;
      return range;
    }
    const textarea = contentRef.current;
    return {
      start: textarea?.selectionStart ?? 0,
      end: textarea?.selectionEnd ?? 0,
    };
  };

  // 이미지 선택 트리거
  const handleImageClick = () => {
    captureSelection();
    imageInputRef.current?.click();
  };

  // 이미지 업로드 처리
  const handleImageFile = async (file: File) => {
    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast({ message: TOAST_IMAGE_UPLOAD_TYPE_MESSAGE, type: 'warning' });
      return;
    }

    if (file.size > THUMBNAIL_MAX_SIZE) {
      showToast({ message: TOAST_IMAGE_UPLOAD_SIZE_MESSAGE, type: 'warning' });
      return;
    }

    if (uploadImageMutation.isPending) return;

    const { start, end } = getSelectionRange();
    const selected = content.slice(start, end).trim();
    const fileLabel = file.name.replace(/\.[^/.]+$/, '');
    const altText = selected || fileLabel || '이미지';
    const placeholderId = `uploading:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const markdown = `![${altText}](${placeholderId})`;
    const nextValue = content.slice(0, start) + markdown + content.slice(end);
    const cursor = start + markdown.length;
    setContentAndSelection(nextValue, cursor, cursor);

    try {
      const response = await uploadImageMutation.mutateAsync(file);
      setContentValue(prev => prev.replace(placeholderId, response.url));
      showToast({ message: TOAST_IMAGE_UPLOAD_SUCCESS_MESSAGE, type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_IMAGE_UPLOAD_FAILURE_MESSAGE;
      setContentValue(prev => prev.replace(markdown, '').replace(placeholderId, ''));
      showToast({ message, type: 'error' });
    }
  };

  // 이미지 선택 후 마크다운 삽입
  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await handleImageFile(file);
  };

  // 이미지 붙여넣기 처리
  const handleImagePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = event.clipboardData?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    event.preventDefault();
    await handleImageFile(file);
  };

  return {
    refs: {
      imageInputRef,
    },
    handlers: {
      handleImageClick,
      handleImagePaste,
      handleImageSelect,
    },
  };
};
