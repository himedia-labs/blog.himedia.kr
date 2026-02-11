import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useUpdateProfileMutation } from '@/app/api/auth/auth.mutations';

import { useToast } from '@/app/shared/components/toast/toast';

import type { ChangeEvent } from 'react';

/**
 * 마이페이지 프로필 편집 훅
 * @description 프로필 아이디 변경과 저장 상태를 관리
 */
export const useProfileEditor = (initialName?: string, initialHandle?: string) => {
  // ref(참조) 변수들
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutateAsync: updateProfile, isPending: isProfileSaving } = useUpdateProfileMutation();

  // 편집 상태
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');

  // 기본값 반영
  useEffect(() => {
    setProfileName(initialName ?? '');
  }, [initialName]);
  useEffect(() => {
    setProfileHandle(initialHandle ?? '');
  }, [initialHandle]);

  // 핸들 입력
  const handleProfileHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nextValue)) {
      showToast({ message: '프로필 아이디는 영문/숫자만 입력할 수 있어요.', type: 'error' });
      return;
    }
    setProfileHandle(nextValue);
  };

  // 프로필 저장
  const handleProfileSave = async (): Promise<boolean> => {
    const nextName = profileName.trim();
    const nextHandle = profileHandle.trim().replace(/^@/, '');
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nextHandle)) {
      showToast({ message: '프로필 아이디는 영문/숫자만 입력할 수 있어요.', type: 'error' });
      return false;
    }
    if (!nextHandle) {
      showToast({ message: '프로필 아이디를 입력해주세요.', type: 'error' });
      return false;
    }
    try {
      await updateProfile({ name: nextName, profileHandle: nextHandle });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '프로필이 저장되었습니다.', type: 'success' });
      return true;
    } catch (error) {
      showToast({ message: '프로필 저장에 실패했습니다.', type: 'error' });
      return false;
    }
  };

  // 편집 시작
  const handleProfileEditStart = () => {
    if (isProfileSaving) return;
    setIsProfileEditing(true);
  };

  // 편집 완료
  const handleProfileEditComplete = () => {
    setIsProfileEditing(false);
  };

  // 편집 취소
  const handleProfileCancel = () => {
    setProfileHandle(initialHandle ?? '');
    setIsProfileEditing(false);
  };

  return {
    isProfileEditing,
    isProfileSaving,
    profileName,
    profileHandle,
    handlers: {
      handleProfileSave,
      handleProfileEditStart,
      handleProfileEditComplete,
      handleProfileHandleChange,
      handleProfileCancel,
    },
  };
};
