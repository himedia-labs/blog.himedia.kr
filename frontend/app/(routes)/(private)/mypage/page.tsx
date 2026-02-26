'use client';

import { Fragment, useMemo, useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LinesEllipsis from 'react-lines-ellipsis';

import { CiCalendar } from 'react-icons/ci';
import { FaUser, FaUserEdit } from 'react-icons/fa';
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import {
  FiAlertCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiGithub,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiMoreHorizontal,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';

import { MYPAGE_TABS } from '@/app/shared/constants/config/mypage.config';
import { EMAIL_VERIFICATION_CODE_LENGTH, PHONE_CONFIG } from '@/app/shared/constants/config/register.config';

import ActionModal from '@/app/shared/components/modal/ActionModal';
import {
  MyPageAccountSkeleton,
  MyPageCommentsSkeleton,
  MyPageIntroSkeleton,
  MyPagePostListSkeleton,
  MyPageValueSkeleton,
} from '@/app/(routes)/(private)/mypage/MyPage.skeleton';
import { stopMenuPropagation } from '@/app/(routes)/(private)/mypage/handlers';
import EditorToolbar from '@/app/shared/components/markdown-editor/EditorToolbar';
import { splitCommentMentions } from '@/app/(routes)/(public)/posts/[postId]/utils';
import { WITHDRAW_MODAL_MESSAGES } from '@/app/shared/constants/messages/modal.message';
import { formatPostPreview } from '@/app/shared/utils/formatPostPreview.utils';
import { formatDateLabel, formatDateTimeLabel, sortPostsByKey } from '@/app/(routes)/(private)/mypage/utils';
import {
  useAccountSettings,
  useActivitySort,
  useBioEditor,
  useCommentEditor,
  useMyPageData,
  useMyPageTab,
  usePostMenu,
  usePostSidebarData,
  useProfileEditor,
  useProfileImageEditor,
} from '@/app/(routes)/(private)/mypage/hooks';
import { useWithdrawAccountMutation } from '@/app/api/auth/auth.mutations';

import styles from '@/app/(routes)/(private)/mypage/MyPage.module.css';
import postListStyles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';
import markdownEditorStyles from '@/app/shared/components/markdown-editor/markdownEditor.module.css';
import markdownStyles from '@/app/shared/components/markdown-editor/markdown.module.css';
import commentStyles from '@/app/(routes)/(public)/posts/[postId]/PostDetail.module.css';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';

import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/app/shared/types/error';

/**
 * 마이페이지
 * @description 내 정보/활동/계정 설정을 관리하는 화면
 */
export default function MyPage() {
  // 탭 상태
  const router = useRouter();
  const { showToast } = useToast();
  const { clearAuth } = useAuthStore();
  const activeTab = useMyPageTab('settings');
  const { mutateAsync: withdrawAccount, isPending: isWithdrawing } = useWithdrawAccountMutation();

  // 데이터 상태
  const {
    currentUserId,
    displayName,
    followerCount,
    followingCount,
    isMyCommentsListLoading,
    isLikedPostsListLoading,
    isMyPostsLoading,
    isUserInfoLoading,
    likedPosts,
    myComments,
    myPosts,
    userBirthDate,
    userEmail,
    userPhone,
    profileHandle,
    profileContactEmail,
    profileGithubUrl,
    profileLinkedinUrl,
    profileTwitterUrl,
    profileFacebookUrl,
    profileWebsiteUrl,
    profileImageUrl,
    userBio,
  } = useMyPageData();

  // 활동 정렬
  const { sortKey, sortedPosts, sortedComments, handleSortChange } = useActivitySort(myPosts, myComments);
  const handleSortToggle = () => handleSortChange(sortKey === 'latest' ? 'popular' : 'latest');
  const { categories: postCategories, tags: postTags } = usePostSidebarData(myPosts);
  const sortedLikedPosts = useMemo(() => sortPostsByKey(likedPosts, sortKey), [likedPosts, sortKey]);

  // 프로필 편집
  const {
    isProfileEditing,
    isProfileSaving,
    profileHandle: editingHandle,
    profileContactEmail: editingContactEmail,
    profileGithubUrl: editingGithubUrl,
    profileLinkedinUrl: editingLinkedinUrl,
    profileTwitterUrl: editingTwitterUrl,
    profileFacebookUrl: editingFacebookUrl,
    profileWebsiteUrl: editingWebsiteUrl,
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
  } = useProfileEditor({
    name: displayName,
    handle: profileHandle,
    contactEmail: profileContactEmail,
    githubUrl: profileGithubUrl,
    linkedinUrl: profileLinkedinUrl,
    twitterUrl: profileTwitterUrl,
    facebookUrl: profileFacebookUrl,
    websiteUrl: profileWebsiteUrl,
  });

  // 프로필 이미지
  const {
    isProfileUpdating,
    profileImageUrl: profileAvatarUrl,
    refs: { avatarInputRef },
    handlers: { handleAvatarClick, handleAvatarChange, handleAvatarRemove, handleAvatarSave, handleAvatarCancel },
  } = useProfileImageEditor(profileImageUrl, isProfileEditing);

  // 게시글 메뉴
  const { isPostDeleting, openPostMenuId, handlePostDelete, handlePostEdit, handlePostMenuToggle } = usePostMenu();

  // 댓글 편집
  const {
    editingCommentId,
    editingContent,
    hasEditingLengthError,
    isDeleting,
    isUpdating,
    openCommentMenuId,
    handleCommentMenuToggle,
    handleDeleteComment,
    handleEditCancel,
    handleEditChange,
    handleEditStart,
    handleEditSubmit,
  } = useCommentEditor();

  // 계정 설정
  const {
    birthDateValue,
    confirmPasswordValue,
    currentPasswordValue,
    emailCodeValue,
    emailValue,
    isEmailCodeSent,
    isEmailVerified,
    isEditingAny,
    isEditingBirthDate,
    isEditingEmail,
    isEditingPassword,
    isEditingPhone,
    isSaving,
    isSendingEmailCode,
    isVerifyingEmailCode,
    showConfirmPassword,
    showCurrentPassword,
    showNewPassword,
    newPasswordValue,
    passwordRuleStatus,
    phoneValue,
    cancelEdit,
    saveBirthDate,
    saveEmail,
    savePassword,
    savePhone,
    sendEmailVerificationCode,
    setConfirmPasswordValue,
    setCurrentPasswordValue,
    setNewPasswordValue,
    handleEmailChange,
    handleEmailCodeChange,
    handleBirthDateChange,
    handlePhoneChange,
    toggleConfirmPasswordVisibility,
    toggleCurrentPasswordVisibility,
    toggleNewPasswordVisibility,
    startBirthDateEdit,
    startEmailEdit,
    startPasswordEdit,
    startPhoneEdit,
  } = useAccountSettings({
    birthDate: userBirthDate,
    email: userEmail,
    phone: userPhone,
  });

  // 자기소개 편집
  const {
    bioPreview,
    profileBio,
    showBioEditor,
    isBioUpdating,
    refs: { bioEditorRef, bioImageInputRef },
    handlers: { handleBioChange, handleBioSave, handleBioToggle, handleBioImageClick, handleBioImageSelect },
    toolbar: { applyBullet, applyCode, applyHeading, applyInlineWrap, applyLink, applyNumbered, applyQuote },
  } = useBioEditor(userBio);

  // 필터 상태
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const toggleCategory = () => {
    setIsTagOpen(false);
    setIsCategoryOpen(prev => !prev);
  };
  const toggleTag = () => {
    setIsCategoryOpen(false);
    setIsTagOpen(prev => !prev);
  };
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setIsCategoryOpen(false);
  };
  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(prev => (prev === tagId ? null : tagId));
    setIsTagOpen(false);
  };
  const selectedCategoryLabel = postCategories.find(category => category.id === selectedCategoryId)?.name;
  const selectedTagLabel = postTags.find(tag => tag.id === selectedTagId)?.name;

  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId && !selectedTagId) return sortedPosts;
    return sortedPosts.filter(post => {
      const matchesCategory = selectedCategoryId ? post.category?.id === selectedCategoryId : true;
      const matchesTag = selectedTagId ? post.tags?.some(tag => tag.id === selectedTagId) : true;
      return matchesCategory && matchesTag;
    });
  }, [selectedCategoryId, selectedTagId, sortedPosts]);

  const accountNameValue = isUserInfoLoading ? <MyPageValueSkeleton width={88} height={18} /> : displayName || '사용자';
  const accountEmailValue = isUserInfoLoading ? <MyPageValueSkeleton width={180} height={18} /> : userEmail || '미등록';
  const accountPhoneValue = isUserInfoLoading ? <MyPageValueSkeleton width={140} height={18} /> : userPhone || '미등록';
  const accountBirthDateValue = isUserInfoLoading ? <MyPageValueSkeleton width={120} height={18} /> : userBirthDate || '미등록';
  const profileNameValue = isUserInfoLoading ? <MyPageValueSkeleton width={96} height={34} /> : displayName || '사용자';
  const profileHandleValue = isUserInfoLoading ? <MyPageValueSkeleton width={86} height={18} /> : `@${profileHandle}`;
  const isProfileActionPending = isProfileSaving || isProfileUpdating;
  const profileSocialLinks = [
    { href: profileContactEmail ? `mailto:${profileContactEmail}` : '', label: '이메일', icon: FiMail },
    { href: profileGithubUrl, label: '깃허브', icon: FiGithub, external: true },
    { href: profileLinkedinUrl, label: '링크드인', icon: FaLinkedinIn, external: true },
    { href: profileTwitterUrl, label: 'X', icon: FaXTwitter, external: true },
    { href: profileFacebookUrl, label: '페이스북', icon: FaFacebookF, external: true },
    { href: profileWebsiteUrl, label: '홈페이지', icon: FiGlobe, external: true },
  ].filter(item => Boolean(item.href));

  const handleProfileAction = () => {
    if (isProfileActionPending) return;

    if (!isProfileEditing) {
      handleProfileEditStart();
      return;
    }

    void handleProfileSaveAll();
  };

  const handleProfileSaveAll = async () => {
    if (isProfileActionPending) return;

    const isProfileSaved = await handleProfileSave();
    if (!isProfileSaved) return;

    const isAvatarSaved = await handleAvatarSave();
    if (!isAvatarSaved) return;

    handleProfileEditComplete();
  };

  const handleProfileCancelAll = () => {
    if (isProfileActionPending) return;

    handleAvatarCancel();
    handleProfileCancel();
  };

  const closeWithdrawModal = () => {
    if (isWithdrawing) return;

    setIsWithdrawModalOpen(false);
    setShowWithdrawPassword(false);
    setWithdrawPassword('');
  };

  const openWithdrawModal = () => {
    if (isWithdrawing) return;

    setShowWithdrawPassword(false);
    setWithdrawPassword('');
    setIsWithdrawModalOpen(true);
  };

  const handleWithdraw = async () => {
    if (isWithdrawing) return;

    const currentPassword = withdrawPassword.trim();
    if (!currentPassword) {
      showToast({ message: WITHDRAW_MODAL_MESSAGES.missingPassword, type: 'warning' });
      return;
    }

    try {
      const result = await withdrawAccount({ currentPassword });

      setIsWithdrawModalOpen(false);
      setShowWithdrawPassword(false);
      setWithdrawPassword('');
      clearAuth();
      showToast({ message: result.message, type: 'success' });
      router.replace('/');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? WITHDRAW_MODAL_MESSAGES.fallbackError;
      showToast({ message, type: 'error' });
    }
  };

  return (
    <section className={styles.container} aria-label="마이페이지">
      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <nav className={styles.list} aria-label="마이페이지 메뉴">
            <div className={styles.listSection}>
              <Link
                className={
                  activeTab === MYPAGE_TABS[0].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[0].href}
              >
                {MYPAGE_TABS[0].label}
              </Link>
              <div className={styles.listDividerLine} aria-hidden="true" />
              <span className={styles.listGroupTitle}>활동</span>
              <Link
                className={
                  activeTab === MYPAGE_TABS[1].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[1].href}
              >
                {MYPAGE_TABS[1].label}
              </Link>
              <Link
                className={
                  activeTab === MYPAGE_TABS[2].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[2].href}
              >
                {MYPAGE_TABS[2].label}
              </Link>
              <Link
                className={
                  activeTab === MYPAGE_TABS[3].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[3].href}
              >
                {MYPAGE_TABS[3].label}
              </Link>
              <div className={styles.listDividerLine} aria-hidden="true" />
              <span className={styles.listGroupTitle}>고객지원</span>
              <Link
                className={
                  activeTab === MYPAGE_TABS[4].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[4].href}
              >
                {MYPAGE_TABS[4].label}
              </Link>
              <div className={styles.listDividerLine} aria-hidden="true" />
              <span className={styles.listGroupTitle}>설정</span>
              <Link
                className={
                  activeTab === MYPAGE_TABS[5].key ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink
                }
                href={MYPAGE_TABS[5].href}
              >
                {MYPAGE_TABS[5].label}
              </Link>
            </div>
          </nav>
        </aside>
        <div className={styles.main}>
          <header className={styles.header}>
            <div className={styles.profileCard}>
              <div className={styles.profileMain}>
                <button
                  type="button"
                  className={styles.avatarButton}
                  aria-label="프로필 이미지 업로드"
                  onClick={handleAvatarClick}
                >
                  <div className={styles.avatar} aria-hidden="true">
                    {profileAvatarUrl ? (
                      <Image
                        className={styles.avatarImage}
                        src={profileAvatarUrl}
                        alt=""
                        width={62}
                        height={62}
                        sizes="62px"
                        unoptimized
                      />
                    ) : isProfileEditing ? (
                      <FaUserEdit className={`${styles.avatarIcon} ${styles.avatarIconEdit}`} />
                    ) : (
                      <FaUser className={styles.avatarIcon} />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    className={styles.avatarInput}
                    type="file"
                    accept="image/*"
                    disabled={!isProfileEditing}
                    onChange={handleAvatarChange}
                  />
                </button>
                <div className={styles.profileInfo}>
                  {isProfileEditing ? (
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{profileNameValue}</span>
                      <span className={styles.profileHandleInputGroup}>
                        <span className={styles.profileHandlePrefix}>@</span>
                        <input
                          className={styles.profileHandleInput}
                          value={editingHandle}
                          onChange={handleProfileHandleChange}
                          placeholder="아이디"
                        />
                      </span>
                    </div>
                  ) : (
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{profileNameValue}</span>
                      <span className={styles.profileHandle}>{profileHandleValue}</span>
                    </div>
                  )}
                  <div className={styles.profileStatsRow}>
                    <div className={styles.profileStats}>
                      <span className={styles.profileStat}>
                        글 <strong>{myPosts.length}</strong>
                      </span>
                      <span className={styles.profileDivider}>·</span>
                      <span className={styles.profileStat}>
                        팔로워 <strong>{followerCount}</strong>
                      </span>
                      <span className={styles.profileDivider}>·</span>
                      <span className={styles.profileStat}>
                        팔로잉 <strong>{followingCount}</strong>
                      </span>
                    </div>
                    {profileSocialLinks.length ? (
                      <div className={styles.profileSocialRow} aria-label="소셜 링크">
                        {profileSocialLinks.map(({ href, label, icon: Icon, external }) => (
                          <a
                            key={label}
                            className={styles.profileSocialLink}
                            href={href}
                            aria-label={label}
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noreferrer' : undefined}
                          >
                            <Icon aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={styles.profileActions}>
                  {isProfileEditing ? (
                    <>
                      <button
                        type="button"
                        className={styles.profileDeleteButton}
                        disabled={isProfileActionPending}
                        onClick={handleAvatarRemove}
                      >
                        사진 지우기
                      </button>
                      <span className={styles.profileActionDivider} aria-hidden="true">
                        |
                      </span>
                      <button
                        type="button"
                        className={styles.profileCancelButton}
                        disabled={isProfileActionPending}
                        onClick={handleProfileCancelAll}
                      >
                        취소
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className={styles.profileEditButton}
                    disabled={isProfileActionPending}
                    onClick={handleProfileAction}
                  >
                    {isProfileEditing ? '저장' : '프로필 수정'}
                  </button>
                </div>
              </div>
              {isProfileEditing ? (
                <div className={styles.profileSocialEditor}>
                  <div className={styles.profileSocialEditorGrid}>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>이메일</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <input
                          type="email"
                          className={styles.profileSocialEditorInput}
                          placeholder="example@email.com"
                          value={editingContactEmail}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileContactEmail(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>깃허브</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <span className={styles.profileSocialEditorPrefix}>https://github.com/</span>
                        <input
                          type="text"
                          className={styles.profileSocialEditorInput}
                          placeholder="username"
                          value={editingGithubUrl}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileGithubUrl(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>링크드인</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <span className={styles.profileSocialEditorPrefix}>https://www.linkedin.com/in/</span>
                        <input
                          type="text"
                          className={styles.profileSocialEditorInput}
                          placeholder="username"
                          value={editingLinkedinUrl}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileLinkedinUrl(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>X (Twitter)</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <span className={styles.profileSocialEditorPrefix}>https://x.com/</span>
                        <input
                          type="text"
                          className={styles.profileSocialEditorInput}
                          placeholder="username"
                          value={editingTwitterUrl}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileTwitterUrl(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>페이스북</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <span className={styles.profileSocialEditorPrefix}>https://www.facebook.com/</span>
                        <input
                          type="text"
                          className={styles.profileSocialEditorInput}
                          placeholder="username"
                          value={editingFacebookUrl}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileFacebookUrl(event.target.value)}
                        />
                      </div>
                    </label>
                    <label className={styles.profileSocialEditorField}>
                      <span className={styles.profileSocialEditorLabel}>홈페이지</span>
                      <div className={styles.profileSocialEditorInputRow}>
                        <input
                          type="text"
                          className={styles.profileSocialEditorInput}
                          placeholder="https://example.com"
                          value={editingWebsiteUrl}
                          disabled={isProfileActionPending}
                          onChange={event => setProfileWebsiteUrl(event.target.value)}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </header>
          <div className={styles.headerDivider} aria-hidden="true" />

          <div className={styles.content}>
            {activeTab === 'settings' ? (
              <div className={styles.settingsSection}>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>소개</span>
                  {!showBioEditor ? (
                    <button type="button" className={styles.settingsButton} onClick={handleBioToggle}>
                      {userBio ? '수정하기' : '작성하기'}
                    </button>
                  ) : null}
                </div>
                {showBioEditor ? (
                  <div className={styles.settingsBody}>
                    <div className={`${markdownEditorStyles.editorBox} ${styles.settingsEditorBox}`}>
                      <EditorToolbar
                        onHeading={applyHeading}
                        onBold={() => applyInlineWrap('**')}
                        onItalic={() => applyInlineWrap('_')}
                        onUnderline={() => applyInlineWrap('<u>', '</u>')}
                        onStrike={() => applyInlineWrap('~~')}
                        onQuote={applyQuote}
                        onCode={applyCode}
                        onLink={applyLink}
                        onImage={handleBioImageClick}
                        onBullet={applyBullet}
                        onNumbered={applyNumbered}
                      />
                      <input
                        ref={bioImageInputRef}
                        className={markdownEditorStyles.srOnly}
                        type="file"
                        accept="image/*"
                        aria-label="자기소개 이미지 선택"
                        onChange={handleBioImageSelect}
                      />
                      <label className={markdownEditorStyles.srOnly} htmlFor="profile-bio">
                        자기소개
                      </label>
                      <textarea
                        ref={bioEditorRef}
                        id="profile-bio"
                        className={`${markdownEditorStyles.editor} ${styles.settingsEditor}`}
                        placeholder="자기소개를 입력하세요."
                        value={profileBio}
                        maxLength={500}
                        onChange={handleBioChange}
                        disabled={isBioUpdating}
                      />
                    </div>
                    <div className={styles.settingsActions}>
                      <button type="button" className={styles.settingsCancelButton} onClick={handleBioToggle}>
                        닫기
                      </button>
                      <button
                        type="button"
                        className={styles.settingsSaveButton}
                        onClick={handleBioSave}
                        disabled={isBioUpdating}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : isUserInfoLoading ? (
                  <MyPageIntroSkeleton />
                ) : profileBio ? (
                  <div className={markdownStyles.markdown}>{bioPreview}</div>
                ) : (
                  <div className={styles.settingsEmpty}>
                    <p className={styles.settingsText}>아직 작성된 소개가 없습니다.</p>
                    <span className={styles.settingsSubtext}>자기소개를 작성하면 내 블로그 상단에 노출됩니다.</span>
                  </div>
                )}
              </div>
            ) : activeTab === 'posts' ? (
              isMyPostsLoading ? (
                <MyPagePostListSkeleton label="내 블로그" />
              ) : myPosts.length ? (
                <div className={styles.postsMain}>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>내 블로그</span>
                    <div className={styles.settingsControlGroup}>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleCategory}
                          disabled={!postCategories.length}
                        >
                          {selectedCategoryLabel ?? '카테고리'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isCategoryOpen ? (
                          <div className={styles.filterMenu}>
                            {postCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedCategoryId === category.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                <span>{category.name}</span>
                                <span className={styles.filterCount}>{category.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleTag}
                          disabled={!postTags.length}
                        >
                          <span className={styles.tagFilterLabel}>
                            {selectedTagLabel ? `#${selectedTagLabel}` : '#태그'}
                          </span>
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isTagOpen ? (
                          <div className={`${styles.filterMenu} ${styles.tagFilterMenu}`}>
                            {postTags.map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedTagId === tag.id
                                    ? `${styles.filterItemActive} ${styles.tagFilterItemActive}`
                                    : ''
                                }`}
                                onClick={() => handleTagSelect(tag.id)}
                              >
                                <span className={styles.tagFilterName}>#{tag.name}</span>
                                <span className={styles.filterCount}>{tag.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.settingsDivider} aria-hidden="true" />
                      <div className={styles.settingsSortGroup}>
                        <button
                          type="button"
                          className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                          onClick={handleSortToggle}
                        >
                          {sortKey === 'popular' ? (
                            <>
                              <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                              인기순
                            </>
                          ) : (
                            <>
                              <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                              최신순
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {filteredPosts.length ? (
                    <ul className={postListStyles.listView}>
                      {filteredPosts.map((post, index) => {
                        const isMyPost = Boolean(currentUserId) && post.author?.id === currentUserId;
                        const thumbnailUrl = post.thumbnailUrl ?? '';
                        const hasThumbnail = Boolean(thumbnailUrl);
                        const listTags = (post.tags ?? []).slice(0, 5);
                        const hasListTags = listTags.length > 0;
                        return (
                          <Fragment key={post.id}>
                            <li>
                              <Link className={postListStyles.postLink} href={`/posts/${post.id}`}>
                                <article
                                  className={
                                    hasThumbnail
                                      ? postListStyles.listItem
                                      : `${postListStyles.listItem} ${postListStyles.listItemNoThumb}`
                                  }
                                >
                                  <div className={postListStyles.listBody}>
                                    <div className={styles.listHeaderRow}>
                                      <h3 className={postListStyles.listTitle}>{post.title || '제목 없음'}</h3>
                                      <div className={styles.listMenuWrapper}>
                                        <button
                                          type="button"
                                          className={styles.listMenuButton}
                                          aria-label="게시글 옵션"
                                          onClick={event => {
                                            stopMenuPropagation(event);
                                            handlePostMenuToggle(post.id);
                                          }}
                                        >
                                          <FiMoreHorizontal aria-hidden="true" />
                                        </button>
                                        {openPostMenuId === post.id ? (
                                          <div className={styles.listMenu} role="menu" onClick={stopMenuPropagation}>
                                            <button
                                              type="button"
                                              className={styles.listMenuItem}
                                              role="menuitem"
                                              onClick={event => {
                                                stopMenuPropagation(event);
                                                handlePostEdit(post.id);
                                              }}
                                            >
                                              <FiEdit2 aria-hidden="true" />
                                              수정
                                            </button>
                                            <button
                                              type="button"
                                              className={styles.listMenuItem}
                                              role="menuitem"
                                              disabled={isPostDeleting}
                                              onClick={event => {
                                                stopMenuPropagation(event);
                                                handlePostDelete(post.id);
                                              }}
                                            >
                                              <FiTrash2 aria-hidden="true" />
                                              삭제
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                    <LinesEllipsis
                                      text={formatPostPreview(post.content, { emptyText: '내용 없음' })}
                                      maxLine="2"
                                      ellipsis="..."
                                      trimRight
                                      basedOn="letters"
                                      className={
                                        hasListTags ? postListStyles.listSummaryWithTags : postListStyles.listSummary
                                      }
                                    />
                                    {hasListTags ? (
                                      <ul className={postListStyles.listTagList} aria-label="태그 목록">
                                        {listTags.map(tag => (
                                          <li key={`${post.id}-list-${tag.id}`} className={postListStyles.listTagItem}>
                                            #{tag.name}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                    <div className={postListStyles.meta}>
                                      <div className={postListStyles.metaAuthorDate}>
                                        <div className={postListStyles.cardAuthor}>
                                          <div
                                            className={
                                              isMyPost
                                                ? `${postListStyles.cardAuthorAvatar} ${postListStyles.cardAuthorAvatarMine}`
                                                : postListStyles.cardAuthorAvatar
                                            }
                                            aria-hidden="true"
                                          >
                                            {post.author?.profileImageUrl ? (
                                              <Image
                                                className={postListStyles.cardAuthorImage}
                                                src={post.author.profileImageUrl}
                                                alt=""
                                                width={24}
                                                height={24}
                                                unoptimized
                                              />
                                            ) : (
                                              <FaUser />
                                            )}
                                          </div>
                                          <span className={postListStyles.cardAuthorText}>
                                            <span className={postListStyles.cardAuthorBy}>by.</span>
                                            <span className={postListStyles.cardAuthorName}>
                                              {post.author?.name ?? '알 수 없음'}
                                            </span>
                                          </span>
                                        </div>
                                        <span className={postListStyles.separator} aria-hidden="true">
                                          |
                                        </span>
                                        <span className={postListStyles.metaGroup}>
                                          <span className={postListStyles.metaItem}>
                                            <CiCalendar aria-hidden="true" />{' '}
                                            {formatDateLabel(post.publishedAt ?? post.createdAt)}
                                          </span>
                                        </span>
                                      </div>
                                      <span className={postListStyles.metaGroup}>
                                        <span className={postListStyles.metaItem}>
                                          <FiEye aria-hidden="true" /> {post.viewCount.toLocaleString()}
                                        </span>
                                        <span className={postListStyles.separator} aria-hidden="true">
                                          |
                                        </span>
                                        <span className={postListStyles.metaItem}>
                                          <FiHeart aria-hidden="true" /> {post.likeCount.toLocaleString()}
                                        </span>
                                        <span className={postListStyles.separator} aria-hidden="true">
                                          |
                                        </span>
                                        <span className={postListStyles.metaItem}>
                                          <FiMessageCircle aria-hidden="true" /> {post.commentCount.toLocaleString()}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                  {hasThumbnail ? (
                                    <div className={postListStyles.listThumb} aria-hidden="true">
                                      <Image
                                        className={postListStyles.listThumbImage}
                                        src={thumbnailUrl}
                                        alt=""
                                        width={0}
                                        height={0}
                                        sizes="100vw"
                                        unoptimized
                                        style={{ width: '100%', height: '100%' }}
                                      />
                                    </div>
                                  ) : null}
                                </article>
                              </Link>
                            </li>
                            {index < filteredPosts.length - 1 ? (
                              <li className={postListStyles.listDividerItem} aria-hidden="true">
                                <div className={postListStyles.listDivider} />
                              </li>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className={styles.empty}>조건에 맞는 게시물이 없습니다.</div>
                  )}
                </div>
              ) : (
                <div className={styles.postsMain}>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>내 블로그</span>
                    <div className={styles.settingsControlGroup}>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleCategory}
                          disabled={!postCategories.length}
                        >
                          {selectedCategoryLabel ?? '카테고리'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isCategoryOpen ? (
                          <div className={styles.filterMenu}>
                            {postCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedCategoryId === category.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                <span>{category.name}</span>
                                <span className={styles.filterCount}>{category.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleTag}
                          disabled={!postTags.length}
                        >
                          <span className={styles.tagFilterLabel}>
                            {selectedTagLabel ? `#${selectedTagLabel}` : '#태그'}
                          </span>
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isTagOpen ? (
                          <div className={`${styles.filterMenu} ${styles.tagFilterMenu}`}>
                            {postTags.map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedTagId === tag.id
                                    ? `${styles.filterItemActive} ${styles.tagFilterItemActive}`
                                    : ''
                                }`}
                                onClick={() => handleTagSelect(tag.id)}
                              >
                                <span className={styles.tagFilterName}>#{tag.name}</span>
                                <span className={styles.filterCount}>{tag.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.settingsDivider} aria-hidden="true" />
                      <div className={styles.settingsSortGroup}>
                        <button
                          type="button"
                          className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                          onClick={handleSortToggle}
                        >
                          {sortKey === 'popular' ? (
                            <>
                              <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                              인기순
                            </>
                          ) : (
                            <>
                              <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                              최신순
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.empty}>아직 작성한 게시물이 없습니다.</div>
                </div>
              )
            ) : activeTab === 'account' ? (
              isUserInfoLoading ? (
                <MyPageAccountSkeleton />
              ) : (
                <div className={styles.settingsSection}>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>계정 설정</span>
                </div>
                <div className={styles.settingsBlock}>
                  <div className={styles.settingsBlockTitle}>기본 정보</div>
                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsItem}>
                      <div className={styles.settingsItemLabel}>이름</div>
                      <div className={styles.settingsItemValue}>{accountNameValue}</div>
                    </div>
                    <div className={`${styles.settingsItem} ${styles.settingsItemEmail}`}>
                      <div className={styles.settingsItemLabel}>이메일 주소</div>
                      <div className={styles.settingsEmailContent}>
                        {isEditingEmail ? (
                          <div className={styles.settingsEmailPanel}>
                            <div className={styles.settingsEmailFieldGroup}>
                              <div className={styles.settingsEmailInputRow}>
                                <input
                                  type="email"
                                  className={`${styles.settingsInput} ${styles.settingsItemInput}`}
                                  value={emailValue}
                                  placeholder="변경할 이메일 주소"
                                  onChange={handleEmailChange}
                                />
                              </div>
                              <p className={styles.settingsEmailVerifyHint}>변경할 이메일로 인증번호를 발송해주세요.</p>
                            </div>

                            <div className={styles.settingsEmailFieldGroup}>
                              <div className={styles.settingsEmailInputRow}>
                                <input
                                  type="text"
                                  className={`${styles.settingsInput} ${styles.settingsItemInput} ${styles.settingsEmailCodeInput}`}
                                  value={emailCodeValue}
                                  placeholder="8자리 인증번호"
                                  maxLength={EMAIL_VERIFICATION_CODE_LENGTH}
                                  autoComplete="one-time-code"
                                  disabled={
                                    !isEmailCodeSent || isSendingEmailCode || isEmailVerified || isVerifyingEmailCode
                                  }
                                  onChange={handleEmailCodeChange}
                                />
                              </div>
                              <p className={styles.settingsEmailVerifyHint}>
                                {isEmailVerified
                                  ? '이메일 인증이 완료되었습니다.'
                                  : isEmailCodeSent
                                    ? '인증번호 8자리를 입력하면 자동으로 확인됩니다.'
                                    : '변경할 이메일로 인증번호를 발송해주세요.'}
                              </p>
                            </div>

                            <div className={styles.settingsEmailActionsRow}>
                              <button
                                type="button"
                                className={styles.settingsButton}
                                disabled={isSaving || isSendingEmailCode}
                                onClick={sendEmailVerificationCode}
                              >
                                {isEmailCodeSent ? '재전송' : '인증번호 발송'}
                              </button>
                              <span className={styles.settingsDivider} aria-hidden="true" />
                              <div className={`${styles.settingsInlineActions} ${styles.settingsInlineActionsInline}`}>
                                <button
                                  type="button"
                                  className={`${styles.settingsButton} ${styles.settingsInlineCancelButton}`}
                                  disabled={isSaving}
                                  onClick={cancelEdit}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className={styles.settingsButton}
                                  disabled={isSaving || !isEmailVerified}
                                  onClick={saveEmail}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.settingsEmailTop}>
                            <div className={styles.settingsItemValue}>{accountEmailValue}</div>
                            {!isEditingAny ? (
                              <button
                                type="button"
                                className={styles.settingsButton}
                                disabled={isSaving}
                                onClick={startEmailEdit}
                              >
                                설정
                              </button>
                            ) : (
                              <span className={styles.settingsButtonPlaceholder} aria-hidden="true">
                                설정
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`${styles.settingsItem} ${isEditingPassword ? styles.settingsItemPasswordEditing : ''}`}
                    >
                      <div className={styles.settingsItemLabel}>비밀번호</div>
                      {isEditingPassword ? (
                        <div className={styles.settingsPasswordPanel}>
                          <div className={styles.settingsPasswordFieldGroup}>
                            <div className={styles.settingsPasswordInputWrap}>
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                className={`${styles.settingsInput} ${styles.settingsItemInput} ${styles.settingsPasswordInput} ${
                                  !showCurrentPassword ? styles.settingsPasswordInputMasked : ''
                                }`}
                                value={currentPasswordValue}
                                placeholder="현재 비밀번호"
                                onChange={event => setCurrentPasswordValue(event.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.settingsPasswordToggle}
                                aria-label={showCurrentPassword ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'}
                                onClick={toggleCurrentPasswordVisibility}
                              >
                                {showCurrentPassword ? (
                                  <FiEyeOff className={styles.settingsPasswordEye} aria-hidden="true" />
                                ) : (
                                  <FiEye className={styles.settingsPasswordEye} aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            <p className={styles.settingsPasswordHint}>
                              확인을 위해 현재 비밀번호를 다시 입력해 주세요.
                            </p>
                          </div>
                          <div className={styles.settingsPasswordFieldGroup}>
                            <div className={styles.settingsPasswordInputWrap}>
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                className={`${styles.settingsInput} ${styles.settingsItemInput} ${styles.settingsPasswordInput} ${
                                  !showNewPassword ? styles.settingsPasswordInputMasked : ''
                                }`}
                                value={newPasswordValue}
                                placeholder="새 비밀번호"
                                onChange={event => setNewPasswordValue(event.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.settingsPasswordToggle}
                                aria-label={showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'}
                                onClick={toggleNewPasswordVisibility}
                              >
                                {showNewPassword ? (
                                  <FiEyeOff className={styles.settingsPasswordEye} aria-hidden="true" />
                                ) : (
                                  <FiEye className={styles.settingsPasswordEye} aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            <div className={styles.settingsPasswordRules}>
                              <p
                                className={`${styles.settingsPasswordRule} ${
                                  passwordRuleStatus.hasInput
                                    ? passwordRuleStatus.hasTypeCombination
                                      ? styles.settingsPasswordRuleValid
                                      : styles.settingsPasswordRuleInvalid
                                    : ''
                                }`}
                              >
                                영문/숫자/특수문자 중, 2가지 이상 포함
                              </p>
                              <p
                                className={`${styles.settingsPasswordRule} ${
                                  passwordRuleStatus.hasInput
                                    ? passwordRuleStatus.hasValidLength
                                      ? styles.settingsPasswordRuleValid
                                      : styles.settingsPasswordRuleInvalid
                                    : ''
                                }`}
                              >
                                8자 이상 32자 이하 입력 (공백 제외)
                              </p>
                              <p
                                className={`${styles.settingsPasswordRule} ${
                                  passwordRuleStatus.hasInput
                                    ? passwordRuleStatus.hasNoTripleRepeat
                                      ? styles.settingsPasswordRuleValid
                                      : styles.settingsPasswordRuleInvalid
                                    : ''
                                }`}
                              >
                                연속 3자 이상 동일한 문자/숫자 제외
                              </p>
                            </div>
                          </div>
                          <div className={styles.settingsPasswordFieldGroup}>
                            <div className={styles.settingsPasswordInputWrap}>
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className={`${styles.settingsInput} ${styles.settingsItemInput} ${styles.settingsPasswordInput} ${
                                  !showConfirmPassword ? styles.settingsPasswordInputMasked : ''
                                }`}
                                value={confirmPasswordValue}
                                placeholder="새 비밀번호 확인"
                                onChange={event => setConfirmPasswordValue(event.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.settingsPasswordToggle}
                                aria-label={showConfirmPassword ? '새 비밀번호 확인 숨기기' : '새 비밀번호 확인 보기'}
                                onClick={toggleConfirmPasswordVisibility}
                              >
                                {showConfirmPassword ? (
                                  <FiEyeOff className={styles.settingsPasswordEye} aria-hidden="true" />
                                ) : (
                                  <FiEye className={styles.settingsPasswordEye} aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            <p className={styles.settingsPasswordHint}>확인을 위해 새 비밀번호를 다시 입력해 주세요.</p>
                          </div>
                          <div className={styles.settingsPasswordActionsRow}>
                            <div className={`${styles.settingsInlineActions} ${styles.settingsInlineActionsInline}`}>
                              <button
                                type="button"
                                className={`${styles.settingsButton} ${styles.settingsInlineCancelButton}`}
                                disabled={isSaving}
                                onClick={cancelEdit}
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                className={styles.settingsButton}
                                disabled={isSaving}
                                onClick={savePassword}
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`${styles.settingsItemValue} ${styles.settingsPasswordValueMask}`}>
                            **********
                          </div>
                          {!isEditingAny ? (
                            <button type="button" className={styles.settingsButton} onClick={startPasswordEdit}>
                              설정
                            </button>
                          ) : (
                            <span className={styles.settingsButtonPlaceholder} aria-hidden="true">
                              설정
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className={`${styles.settingsItem} ${styles.settingsItemEmail}`}>
                      <div className={styles.settingsItemLabel}>전화번호</div>
                      <div className={styles.settingsEmailContent}>
                        <div className={styles.settingsEmailTop}>
                          {isEditingPhone ? (
                            <>
                              <input
                                type="tel"
                                className={`${styles.settingsInput} ${styles.settingsItemInput}`}
                                value={phoneValue}
                                placeholder="010 1234 5678"
                                maxLength={PHONE_CONFIG.FORMATTED_MAX_LENGTH}
                                onChange={handlePhoneChange}
                              />
                              <div className={`${styles.settingsInlineActions} ${styles.settingsInlineActionsInline}`}>
                                <button
                                  type="button"
                                  className={`${styles.settingsButton} ${styles.settingsInlineCancelButton}`}
                                  disabled={isSaving}
                                  onClick={cancelEdit}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className={styles.settingsButton}
                                  disabled={isSaving}
                                  onClick={savePhone}
                                >
                                  저장
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={styles.settingsItemValue}>{accountPhoneValue}</div>
                              {!isEditingAny ? (
                                <button type="button" className={styles.settingsButton} onClick={startPhoneEdit}>
                                  설정
                                </button>
                              ) : (
                                <span className={styles.settingsButtonPlaceholder} aria-hidden="true">
                                  설정
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`${styles.settingsItem} ${styles.settingsItemEmail}`}>
                      <div className={styles.settingsItemLabel}>생년월일</div>
                      <div className={styles.settingsEmailContent}>
                        <div className={styles.settingsEmailTop}>
                          {isEditingBirthDate ? (
                            <>
                              <input
                                type="text"
                                className={`${styles.settingsInput} ${styles.settingsItemInput}`}
                                value={birthDateValue}
                                placeholder="YYYY-MM-DD"
                                inputMode="numeric"
                                maxLength={10}
                                onChange={handleBirthDateChange}
                              />
                              <div className={`${styles.settingsInlineActions} ${styles.settingsInlineActionsInline}`}>
                                <button
                                  type="button"
                                  className={`${styles.settingsButton} ${styles.settingsInlineCancelButton}`}
                                  disabled={isSaving}
                                  onClick={cancelEdit}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className={styles.settingsButton}
                                  disabled={isSaving}
                                  onClick={saveBirthDate}
                                >
                                  저장
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={styles.settingsItemValue}>{accountBirthDateValue}</div>
                              {!isEditingAny ? (
                                <button type="button" className={styles.settingsButton} onClick={startBirthDateEdit}>
                                  설정
                                </button>
                              ) : (
                                <span className={styles.settingsButtonPlaceholder} aria-hidden="true">
                                  설정
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingsFooter}>
                  <button
                    type="button"
                    className={styles.withdrawButton}
                    disabled={isWithdrawing}
                    onClick={openWithdrawModal}
                  >
                    회원탈퇴 <FiChevronRight aria-hidden="true" />
                  </button>
                </div>
                </div>
              )
            ) : activeTab === 'comments' ? (
              isMyCommentsListLoading ? (
                <MyPageCommentsSkeleton />
              ) : myComments.length ? (
                <>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>남긴 댓글</span>
                    <div className={styles.settingsSortGroup}>
                      <button
                        type="button"
                        className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                        onClick={handleSortToggle}
                      >
                        {sortKey === 'popular' ? (
                          <>
                            <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                            인기순
                          </>
                        ) : (
                          <>
                            <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                            최신순
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={commentStyles.commentList}>
                    {sortedComments.map((comment, index) => {
                      const postId = comment.post?.id ?? '';
                      const postTitle = comment.post?.title ?? '게시글 없음';
                      const commentLabel = comment.parentId ? '남긴 대댓글' : '남긴 댓글';
                      const commentLink = postId ? `/posts/${postId}#comment-${comment.id}` : '';
                      const commentDate = formatDateTimeLabel(comment.createdAt);
                      const isEditing = editingCommentId === comment.id;
                      const isLinkEnabled = Boolean(commentLink) && !isEditing;
                      const commentPostLabel = `‘${postTitle}’에 ${commentLabel}`;

                      return (
                        <Fragment key={comment.id}>
                          <div className={commentStyles.commentItem} id={`comment-${comment.id}`}>
                            <div className={commentStyles.commentInner}>
                              <div className={commentStyles.commentHeaderRow}>
                                <div className={commentStyles.commentProfile}>
                                  <div className={commentStyles.commentAvatarGroup}>
                                    <span className={commentStyles.commentAvatar} aria-hidden="true">
                                      {profileAvatarUrl ? (
                                        <Image
                                          className={commentStyles.commentAvatarImage}
                                          src={profileAvatarUrl}
                                          alt=""
                                          width={30}
                                          height={30}
                                          sizes="30px"
                                          unoptimized
                                        />
                                      ) : (
                                        <FaUser />
                                      )}
                                    </span>
                                  </div>
                                  <div className={commentStyles.commentMeta}>
                                    {isLinkEnabled ? (
                                      <Link className={commentStyles.commentAuthor} href={commentLink}>
                                        {commentPostLabel}
                                      </Link>
                                    ) : (
                                      <span className={commentStyles.commentAuthor}>{commentPostLabel}</span>
                                    )}
                                    <span className={commentStyles.commentDate}>{commentDate}</span>
                                  </div>
                                </div>
                                <div className={commentStyles.commentMoreWrapper}>
                                  <button
                                    type="button"
                                    className={commentStyles.commentMoreButton}
                                    aria-label="댓글 옵션"
                                    onClick={event => {
                                      stopMenuPropagation(event);
                                      handleCommentMenuToggle(comment.id);
                                    }}
                                  >
                                    <FiMoreHorizontal aria-hidden="true" />
                                  </button>
                                  {openCommentMenuId === comment.id ? (
                                    <div className={commentStyles.commentMoreMenu} role="menu" onClick={stopMenuPropagation}>
                                      <button
                                        type="button"
                                        className={commentStyles.commentMoreItem}
                                        role="menuitem"
                                        onClick={event => {
                                          stopMenuPropagation(event);
                                          handleEditStart(comment.id, comment.content);
                                        }}
                                      >
                                        <FiEdit2 aria-hidden="true" />
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        className={commentStyles.commentMoreItem}
                                        role="menuitem"
                                        disabled={isDeleting}
                                        onClick={event => {
                                          stopMenuPropagation(event);
                                          handleDeleteComment(postId, comment.id);
                                        }}
                                      >
                                        <FiTrash2 aria-hidden="true" />
                                        삭제
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className={commentStyles.commentContent}>
                                {isEditing ? (
                                  <div className={commentStyles.commentEditForm} onClick={stopMenuPropagation}>
                                    <textarea
                                      className={`${commentStyles.commentTextarea} ${
                                        hasEditingLengthError ? commentStyles.commentTextareaError : ''
                                      }`}
                                      name="comment-edit"
                                      value={editingContent}
                                      onChange={handleEditChange}
                                    />
                                    <div className={commentStyles.commentEditActions}>
                                      {hasEditingLengthError ? (
                                        <span className={commentStyles.commentError}>1,000자까지 입력 가능해요.</span>
                                      ) : null}
                                      <button
                                        type="button"
                                        className={commentStyles.commentCancelButton}
                                        onClick={handleEditCancel}
                                        disabled={isUpdating}
                                      >
                                        취소
                                      </button>
                                      <button
                                        type="button"
                                        className={
                                          editingContent.trim()
                                            ? `${commentStyles.commentButton} ${commentStyles.commentButtonActive}`
                                            : commentStyles.commentButton
                                        }
                                        disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                                        onClick={() => handleEditSubmit(postId, comment.id)}
                                      >
                                        수정 완료
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className={commentStyles.commentBody}>
                                      {splitCommentMentions(comment.content).map((part, partIndex) =>
                                        part.type === 'mention' ? (
                                          <span key={`${part.value}-${partIndex}`} className={commentStyles.commentMention}>
                                            {part.value}
                                          </span>
                                        ) : (
                                          <Fragment key={`${part.value}-${partIndex}`}>{part.value}</Fragment>
                                        ),
                                      )}
                                    </p>
                                    <div className={commentStyles.commentFooter}>
                                      <span className={commentStyles.commentActionButton}>
                                        <FiHeart aria-hidden="true" />
                                        <span className={commentStyles.commentActionValue}>{comment.likeCount.toLocaleString()}</span>
                                      </span>
                                      <span className={commentStyles.commentActionButton}>
                                        <FiMessageCircle aria-hidden="true" />
                                        <span className={commentStyles.commentActionValue}>
                                          {comment.replyCount.toLocaleString()}
                                        </span>
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {index < sortedComments.length - 1 ? (
                            <div className={commentStyles.commentDividerLine} aria-hidden="true" />
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>남긴 댓글</span>
                    <div className={styles.settingsSortGroup}>
                      <button
                        type="button"
                        className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                        onClick={handleSortToggle}
                      >
                        {sortKey === 'popular' ? (
                          <>
                            <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                            인기순
                          </>
                        ) : (
                          <>
                            <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                            최신순
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.empty}>아직 남긴 댓글이 없습니다.</div>
                </>
              )
            ) : activeTab === 'likes' ? (
              isLikedPostsListLoading ? (
                <MyPagePostListSkeleton label="좋아한 포스트" showFilters={false} />
              ) : (
                <>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>좋아한 포스트</span>
                  <div className={styles.settingsSortGroup}>
                    <button
                      type="button"
                      className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                      onClick={handleSortToggle}
                    >
                      {sortKey === 'popular' ? (
                        <>
                          <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                          인기순
                        </>
                      ) : (
                        <>
                          <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                          최신순
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {sortedLikedPosts.length ? (
                  <ul className={postListStyles.listView}>
                    {sortedLikedPosts.map((post, index) => {
                      const isMyPost = Boolean(currentUserId) && post.author?.id === currentUserId;
                      const thumbnailUrl = post.thumbnailUrl ?? '';
                      const hasThumbnail = Boolean(thumbnailUrl);
                      const listTags = (post.tags ?? []).slice(0, 5);
                      const hasListTags = listTags.length > 0;
                      return (
                        <Fragment key={post.id}>
                          <li>
                            <Link className={postListStyles.postLink} href={`/posts/${post.id}`}>
                              <article
                                className={
                                  hasThumbnail
                                    ? postListStyles.listItem
                                    : `${postListStyles.listItem} ${postListStyles.listItemNoThumb}`
                                }
                              >
                                <div className={postListStyles.listBody}>
                                  <div className={styles.listHeaderRow}>
                                    <h3 className={postListStyles.listTitle}>{post.title || '제목 없음'}</h3>
                                    {isMyPost ? (
                                      <div className={styles.listMenuWrapper}>
                                        <button
                                          type="button"
                                          className={styles.listMenuButton}
                                          aria-label="게시글 옵션"
                                          onClick={event => {
                                            stopMenuPropagation(event);
                                            handlePostMenuToggle(post.id);
                                          }}
                                        >
                                          <FiMoreHorizontal aria-hidden="true" />
                                        </button>
                                        {openPostMenuId === post.id ? (
                                          <div className={styles.listMenu} role="menu" onClick={stopMenuPropagation}>
                                            <button
                                              type="button"
                                              className={styles.listMenuItem}
                                              role="menuitem"
                                              onClick={event => {
                                                stopMenuPropagation(event);
                                                handlePostEdit(post.id);
                                              }}
                                            >
                                              <FiEdit2 aria-hidden="true" />
                                              수정
                                            </button>
                                            <button
                                              type="button"
                                              className={styles.listMenuItem}
                                              role="menuitem"
                                              disabled={isPostDeleting}
                                              onClick={event => {
                                                stopMenuPropagation(event);
                                                handlePostDelete(post.id);
                                              }}
                                            >
                                              <FiTrash2 aria-hidden="true" />
                                              삭제
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                  <LinesEllipsis
                                    text={formatPostPreview(post.content, { emptyText: '내용 없음' })}
                                    maxLine="2"
                                    ellipsis="..."
                                    trimRight
                                    basedOn="letters"
                                    className={
                                      hasListTags ? postListStyles.listSummaryWithTags : postListStyles.listSummary
                                    }
                                  />
                                  {hasListTags ? (
                                    <ul className={postListStyles.listTagList} aria-label="태그 목록">
                                      {listTags.map(tag => (
                                        <li key={`${post.id}-list-${tag.id}`} className={postListStyles.listTagItem}>
                                          #{tag.name}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  <div className={postListStyles.meta}>
                                    <div className={postListStyles.metaAuthorDate}>
                                      <div className={postListStyles.cardAuthor}>
                                        <div
                                          className={
                                            isMyPost
                                              ? `${postListStyles.cardAuthorAvatar} ${postListStyles.cardAuthorAvatarMine}`
                                              : postListStyles.cardAuthorAvatar
                                          }
                                          aria-hidden="true"
                                        >
                                          {post.author?.profileImageUrl ? (
                                            <Image
                                              className={postListStyles.cardAuthorImage}
                                              src={post.author.profileImageUrl}
                                              alt=""
                                              width={24}
                                              height={24}
                                              unoptimized
                                            />
                                          ) : (
                                            <FaUser />
                                          )}
                                        </div>
                                        <span className={postListStyles.cardAuthorText}>
                                          <span className={postListStyles.cardAuthorBy}>by.</span>
                                          <span className={postListStyles.cardAuthorName}>
                                            {post.author?.name ?? '알 수 없음'}
                                          </span>
                                        </span>
                                      </div>
                                      <span className={postListStyles.separator} aria-hidden="true">
                                        |
                                      </span>
                                      <span className={postListStyles.metaGroup}>
                                        <span className={postListStyles.metaItem}>
                                          <CiCalendar aria-hidden="true" />{' '}
                                          {formatDateLabel(post.publishedAt ?? post.createdAt)}
                                        </span>
                                      </span>
                                    </div>
                                    <span className={postListStyles.metaGroup}>
                                      <span className={postListStyles.metaItem}>
                                        <FiEye aria-hidden="true" /> {post.viewCount.toLocaleString()}
                                      </span>
                                      <span className={postListStyles.separator} aria-hidden="true">
                                        |
                                      </span>
                                      <span className={postListStyles.metaItem}>
                                        <FiHeart aria-hidden="true" /> {post.likeCount.toLocaleString()}
                                      </span>
                                      <span className={postListStyles.separator} aria-hidden="true">
                                        |
                                      </span>
                                      <span className={postListStyles.metaItem}>
                                        <FiMessageCircle aria-hidden="true" /> {post.commentCount.toLocaleString()}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                {hasThumbnail ? (
                                  <div className={postListStyles.listThumb} aria-hidden="true">
                                    <Image
                                      className={postListStyles.listThumbImage}
                                      src={thumbnailUrl}
                                      alt=""
                                      width={0}
                                      height={0}
                                      sizes="100vw"
                                      unoptimized
                                      style={{ width: '100%', height: '100%' }}
                                    />
                                  </div>
                                ) : null}
                              </article>
                            </Link>
                          </li>
                          {index < sortedLikedPosts.length - 1 ? (
                            <li className={postListStyles.listDividerItem} aria-hidden="true">
                              <div className={postListStyles.listDivider} />
                            </li>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={styles.empty}>아직 좋아요한 게시물이 없습니다.</div>
                )}
                </>
              )
            ) : null}
          </div>
        </div>
      </div>

      {isWithdrawModalOpen ? (
        <ActionModal
          body={
            <>
              <div className={styles.withdrawGuide}>
                <ul className={styles.withdrawGuideList}>
                  {WITHDRAW_MODAL_MESSAGES.guides.map(guide => (
                    <li key={guide} className={styles.withdrawGuideItem}>
                      {guide}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.withdrawGuideWarning}>
                <FiAlertCircle className={styles.withdrawGuideWarningIcon} aria-hidden="true" />
                {WITHDRAW_MODAL_MESSAGES.warning}
              </div>
              <p className={styles.settingsPasswordHint}>{WITHDRAW_MODAL_MESSAGES.description}</p>
              <div className={styles.settingsPasswordInputWrap}>
                <input
                  type={showWithdrawPassword ? 'text' : 'password'}
                  className={`${styles.settingsInput} ${styles.settingsPasswordInput} ${
                    !showWithdrawPassword ? styles.settingsPasswordInputMasked : ''
                  }`}
                  value={withdrawPassword}
                  placeholder={WITHDRAW_MODAL_MESSAGES.placeholder}
                  autoComplete="current-password"
                  disabled={isWithdrawing}
                  onChange={event => setWithdrawPassword(event.target.value)}
                />
                <button
                  type="button"
                  className={styles.settingsPasswordToggle}
                  aria-label={showWithdrawPassword ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'}
                  disabled={isWithdrawing}
                  onClick={() => setShowWithdrawPassword(prev => !prev)}
                >
                  {showWithdrawPassword ? (
                    <FiEyeOff className={styles.settingsPasswordEye} aria-hidden="true" />
                  ) : (
                    <FiEye className={styles.settingsPasswordEye} aria-hidden="true" />
                  )}
                </button>
              </div>
            </>
          }
          title={WITHDRAW_MODAL_MESSAGES.title}
          cancelLabel={WITHDRAW_MODAL_MESSAGES.cancel}
          confirmLabel={WITHDRAW_MODAL_MESSAGES.confirm}
          confirmVariant="danger"
          cancelDisabled={isWithdrawing}
          confirmDisabled={isWithdrawing}
          onClose={closeWithdrawModal}
          onConfirm={handleWithdraw}
        />
      ) : null}
    </section>
  );
}
