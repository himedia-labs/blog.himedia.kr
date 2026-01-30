import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useUpdateProfileImageMutation } from '@/app/api/auth/auth.mutations';
import { uploadsApi } from '@/app/api/uploads/uploads.api';
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
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // 기본값 반영
  useEffect(() => {
    setProfileImageUrl(initialImageUrl ?? '');
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
    try {
      const { url } = await uploadsApi.uploadAvatar(file);
      await updateProfileImage({ profileImageUrl: url });
      setProfileImageUrl(url);
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '프로필 이미지가 업데이트되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '프로필 이미지 업로드에 실패했습니다.', type: 'error' });
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  return {
    isProfileUpdating,
    profileImageUrl,
    refs: {
      avatarInputRef,
    },
    handlers: {
      handleAvatarClick,
      handleAvatarChange,
    },
  };
};
