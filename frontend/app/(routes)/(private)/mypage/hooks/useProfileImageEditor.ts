import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { uploadsApi } from '@/app/api/uploads/uploads.api';
import { useUpdateProfileImageMutation } from '@/app/api/auth/auth.mutations';

import { useToast } from '@/app/shared/components/toast/toast';

import type { ChangeEvent } from 'react';

/**
 * 마이페이지 프로필 이미지 훅
 * @description 프로필 이미지 변경과 업로드를 관리
 */
export const useProfileImageEditor = (initialImageUrl?: string | null, isProfileEditing?: boolean) => {
  // ref(참조) 변수들
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutateAsync: updateProfileImage, isPending: isProfileUpdating } = useUpdateProfileImageMutation();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // 편집 상태
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  // 기본값 반영
  useEffect(() => {
    setProfileImageUrl(initialImageUrl ?? '');
    setPendingImageUrl(null);
  }, [initialImageUrl]);

  // 프로필 이미지 클릭
  const handleAvatarClick = () => {
    if (!isProfileEditing) return;
    avatarInputRef.current?.click();
  };

  // 프로필 이미지 변경
  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAvatarUploading(true);

    try {
      const { url } = await uploadsApi.uploadAvatar(file);

      setProfileImageUrl(url);
      setPendingImageUrl(url);
    } catch {
      showToast({ message: '프로필 이미지 업로드에 실패했습니다.', type: 'error' });
    } finally {
      setIsAvatarUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  // 프로필 이미지 삭제
  const handleAvatarRemove = () => {
    if (isProfileUpdating || isAvatarUploading) return;

    if (!profileImageUrl) {
      showToast({ message: '삭제할 프로필 이미지가 없습니다.', type: 'warning' });
      return;
    }

    if (!isProfileEditing) return;

    setProfileImageUrl('');
    setPendingImageUrl('');
  };

  // 프로필 이미지 저장
  const handleAvatarSave = async (): Promise<boolean> => {
    if (isAvatarUploading) return false;
    if (pendingImageUrl === null) return true;

    try {
      await updateProfileImage({ profileImageUrl: pendingImageUrl || null });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: pendingImageUrl ? '프로필 이미지가 업데이트되었습니다.' : '프로필 이미지가 삭제되었습니다.', type: 'success' });
      setPendingImageUrl(null);
      return true;
    } catch {
      showToast({ message: '프로필 이미지 저장에 실패했습니다.', type: 'error' });
      return false;
    }
  };

  // 프로필 이미지 취소
  const handleAvatarCancel = () => {
    setProfileImageUrl(initialImageUrl ?? '');
    setPendingImageUrl(null);
  };

  return {
    isProfileUpdating: isProfileUpdating || isAvatarUploading,
    profileImageUrl,
    refs: {
      avatarInputRef,
    },
    handlers: {
      handleAvatarClick,
      handleAvatarChange,
      handleAvatarRemove,
      handleAvatarSave,
      handleAvatarCancel,
    },
  };
};
