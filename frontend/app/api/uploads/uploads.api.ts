import { axiosInstance } from '@/app/shared/network/axios.instance';

import type { UploadThumbnailResponse } from '@/app/shared/types/upload';

// 썸네일 업로드
const uploadThumbnail = async (file: File): Promise<UploadThumbnailResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post<UploadThumbnailResponse>('/uploads/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// 본문 이미지 업로드
const uploadImage = async (file: File): Promise<UploadThumbnailResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post<UploadThumbnailResponse>('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// 프로필 이미지 업로드
const uploadAvatar = async (file: File): Promise<UploadThumbnailResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post<UploadThumbnailResponse>('/uploads/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadsApi = {
  uploadThumbnail,
  uploadImage,
  uploadAvatar,
};
