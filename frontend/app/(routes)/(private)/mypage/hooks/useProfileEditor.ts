import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useUpdateProfileMutation } from '@/app/api/auth/auth.mutations';

import { useToast } from '@/app/shared/components/toast/toast';

import type { ChangeEvent } from 'react';

const PROFILE_GITHUB_PREFIX = 'https://github.com/';
const PROFILE_LINKEDIN_PREFIX = 'https://www.linkedin.com/in/';
const PROFILE_TWITTER_PREFIX = 'https://x.com/';
const PROFILE_FACEBOOK_PREFIX = 'https://www.facebook.com/';

/**
 * 소셜 입력값 추출
 * @description URL 또는 계정 문자열에서 계정 부분만 추출
 */
const extractSocialAccount = (prefix: string, value?: string | null) => {
  const trimmedValue = value?.trim() ?? '';
  if (!trimmedValue) return '';

  const prefixLower = prefix.toLowerCase();
  if (trimmedValue.toLowerCase().startsWith(prefixLower)) {
    return trimmedValue.slice(prefix.length).replace(/^@/, '').replace(/^\/+/, '');
  }

  const protocolFreePrefix = prefix.replace(/^https?:\/\//i, '');
  const protocolFreeValue = trimmedValue.replace(/^https?:\/\//i, '');
  if (protocolFreeValue.toLowerCase().startsWith(protocolFreePrefix.toLowerCase())) {
    return protocolFreeValue.slice(protocolFreePrefix.length).replace(/^@/, '').replace(/^\/+/, '');
  }

  return trimmedValue.replace(/^@/, '').replace(/^\/+/, '');
};

/**
 * 소셜 URL 생성
 * @description 계정 입력값을 저장용 전체 URL로 변환
 */
const buildSocialUrl = (prefix: string, value: string) => {
  const accountValue = extractSocialAccount(prefix, value);
  return accountValue ? `${prefix}${accountValue}` : null;
};

interface UseProfileEditorParams {
  name?: string;
  handle?: string;
  contactEmail?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
}

/**
 * 마이페이지 프로필 편집 훅
 * @description 프로필 아이디/소셜 링크 변경과 저장 상태를 관리
 */
export const useProfileEditor = ({
  name: initialName,
  handle: initialHandle,
  contactEmail: initialContactEmail,
  githubUrl: initialGithubUrl,
  linkedinUrl: initialLinkedinUrl,
  twitterUrl: initialTwitterUrl,
  facebookUrl: initialFacebookUrl,
  websiteUrl: initialWebsiteUrl,
}: UseProfileEditorParams) => {
  // ref(참조) 변수들
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutateAsync: updateProfile, isPending: isProfileSaving } = useUpdateProfileMutation();

  // 편집 상태
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileHandle, setProfileHandle] = useState(initialHandle ?? '');
  const [profileContactEmail, setProfileContactEmail] = useState(initialContactEmail ?? '');
  const [profileGithubUrl, setProfileGithubUrl] = useState(extractSocialAccount(PROFILE_GITHUB_PREFIX, initialGithubUrl));
  const [profileLinkedinUrl, setProfileLinkedinUrl] = useState(
    extractSocialAccount(PROFILE_LINKEDIN_PREFIX, initialLinkedinUrl),
  );
  const [profileTwitterUrl, setProfileTwitterUrl] = useState(
    extractSocialAccount(PROFILE_TWITTER_PREFIX, initialTwitterUrl),
  );
  const [profileFacebookUrl, setProfileFacebookUrl] = useState(
    extractSocialAccount(PROFILE_FACEBOOK_PREFIX, initialFacebookUrl),
  );
  const [profileWebsiteUrl, setProfileWebsiteUrl] = useState(initialWebsiteUrl ?? '');

  // URL 정규화
  const normalizeUrlValue = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return null;
    if (/^https?:\/\//i.test(nextValue)) return nextValue;
    return `https://${nextValue}`;
  };

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
    const nextName = (initialName ?? '').trim();
    const nextHandle = profileHandle.trim().replace(/^@/, '');
    const nextContactEmail = profileContactEmail.trim().toLowerCase() || null;
    const nextWebsiteUrl = normalizeUrlValue(profileWebsiteUrl);
    const nextGithubUrl = buildSocialUrl(PROFILE_GITHUB_PREFIX, profileGithubUrl);
    const nextLinkedinUrl = buildSocialUrl(PROFILE_LINKEDIN_PREFIX, profileLinkedinUrl);
    const nextTwitterUrl = buildSocialUrl(PROFILE_TWITTER_PREFIX, profileTwitterUrl);
    const nextFacebookUrl = buildSocialUrl(PROFILE_FACEBOOK_PREFIX, profileFacebookUrl);

    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nextHandle)) {
      showToast({ message: '프로필 아이디는 영문/숫자만 입력할 수 있어요.', type: 'error' });
      return false;
    }
    if (!nextHandle) {
      showToast({ message: '프로필 아이디를 입력해주세요.', type: 'error' });
      return false;
    }
    try {
      await updateProfile({
        name: nextName,
        profileHandle: nextHandle,
        profileContactEmail: nextContactEmail,
        profileGithubUrl: nextGithubUrl,
        profileLinkedinUrl: nextLinkedinUrl,
        profileTwitterUrl: nextTwitterUrl,
        profileFacebookUrl: nextFacebookUrl,
        profileWebsiteUrl: nextWebsiteUrl,
      });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '프로필이 저장되었습니다.', type: 'success' });
      return true;
    } catch {
      showToast({ message: '프로필 저장에 실패했습니다.', type: 'error' });
      return false;
    }
  };

  // 편집 시작
  const handleProfileEditStart = () => {
    if (isProfileSaving) return;

    setProfileHandle(initialHandle ?? '');
    setProfileContactEmail(initialContactEmail ?? '');
    setProfileGithubUrl(extractSocialAccount(PROFILE_GITHUB_PREFIX, initialGithubUrl));
    setProfileLinkedinUrl(extractSocialAccount(PROFILE_LINKEDIN_PREFIX, initialLinkedinUrl));
    setProfileTwitterUrl(extractSocialAccount(PROFILE_TWITTER_PREFIX, initialTwitterUrl));
    setProfileFacebookUrl(extractSocialAccount(PROFILE_FACEBOOK_PREFIX, initialFacebookUrl));
    setProfileWebsiteUrl(initialWebsiteUrl ?? '');
    setIsProfileEditing(true);
  };

  // 편집 완료
  const handleProfileEditComplete = () => {
    setIsProfileEditing(false);
  };

  // 편집 취소
  const handleProfileCancel = () => {
    setProfileHandle(initialHandle ?? '');
    setProfileContactEmail(initialContactEmail ?? '');
    setProfileGithubUrl(extractSocialAccount(PROFILE_GITHUB_PREFIX, initialGithubUrl));
    setProfileLinkedinUrl(extractSocialAccount(PROFILE_LINKEDIN_PREFIX, initialLinkedinUrl));
    setProfileTwitterUrl(extractSocialAccount(PROFILE_TWITTER_PREFIX, initialTwitterUrl));
    setProfileFacebookUrl(extractSocialAccount(PROFILE_FACEBOOK_PREFIX, initialFacebookUrl));
    setProfileWebsiteUrl(initialWebsiteUrl ?? '');
    setIsProfileEditing(false);
  };

  return {
    isProfileEditing,
    isProfileSaving,
    profileHandle,
    profileContactEmail,
    profileGithubUrl,
    profileLinkedinUrl,
    profileTwitterUrl,
    profileFacebookUrl,
    profileWebsiteUrl,
    handlers: {
      setProfileContactEmail,
      setProfileGithubUrl,
      setProfileLinkedinUrl,
      setProfileTwitterUrl,
      setProfileFacebookUrl,
      setProfileWebsiteUrl,
      handleProfileSave,
      handleProfileEditStart,
      handleProfileEditComplete,
      handleProfileHandleChange,
      handleProfileCancel,
    },
  };
};
