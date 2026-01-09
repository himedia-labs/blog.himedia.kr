import { useMutation } from '@tanstack/react-query';

import { uploadsApi } from './uploads.api';
import type { UploadThumbnailResponse } from '@/app/shared/types/upload';

// 썸네일 업로드 뮤테이션
export const useUploadThumbnailMutation = () => {
  return useMutation<UploadThumbnailResponse, Error, File>({
    mutationFn: uploadsApi.uploadThumbnail,
  });
};

// 본문 이미지 업로드 뮤테이션
export const useUploadImageMutation = () => {
  return useMutation<UploadThumbnailResponse, Error, File>({
    mutationFn: uploadsApi.uploadImage,
  });
};
