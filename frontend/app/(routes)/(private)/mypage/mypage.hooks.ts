import { useEffect, useMemo, useRef, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import {
  useUpdateProfileBioMutation,
  useUpdateProfileImageMutation,
  useUpdateProfileMutation,
} from '@/app/api/auth/auth.mutations';
import { authKeys } from '@/app/api/auth/auth.keys';
import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { commentsApi } from '@/app/api/comments/comments.api';
import { commentsKeys } from '@/app/api/comments/comments.keys';
import { useMyCommentsQuery } from '@/app/api/comments/comments.queries';
import { useFollowersQuery, useFollowingsQuery } from '@/app/api/follows/follows.queries';
import { postsApi } from '@/app/api/posts/posts.api';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { useLikedPostsQuery, usePostsQuery } from '@/app/api/posts/posts.queries';
import { uploadsApi } from '@/app/api/uploads/uploads.api';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';
import { renderMarkdownPreview } from '@/app/shared/utils/markdownPreview';

import { getInitialTab, sortPostsByKey } from './mypage.utils';

import type { ChangeEvent } from 'react';
import type { MyCommentItem } from '@/app/shared/types/comment';
import type { PostListItem } from '@/app/shared/types/post';
import type { ActivitySortKey, TabKey } from './mypage.utils';

// 마이페이지 탭 훅
export const useMyPageTab = (defaultTab: TabKey) => {
  // 탭 상태
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab(searchParams.get('tab'), defaultTab));

  // 탭 동기화
  useEffect(() => {
    setActiveTab(getInitialTab(searchParams.get('tab'), defaultTab));
  }, [defaultTab, searchParams]);

  return activeTab;
};

// 마이페이지 데이터 훅
export const useMyPageData = () => {
  // 인증 상태
  const { accessToken } = useAuthStore();

  // 데이터 조회
  const { data: currentUser } = useCurrentUserQuery();
  const { data: followersData } = useFollowersQuery({ enabled: Boolean(accessToken) });
  const { data: followingsData } = useFollowingsQuery({ enabled: Boolean(accessToken) });
  const { data: myCommentsData } = useMyCommentsQuery({ enabled: Boolean(accessToken) });
  const { data: likedPostsData } = useLikedPostsQuery(
    { sort: 'createdAt', order: 'DESC', limit: 30 },
    { enabled: Boolean(accessToken) },
  );
  const { data: postsData } = usePostsQuery(
    { sort: 'createdAt', order: 'DESC', limit: 30 },
    { enabled: Boolean(accessToken) },
  );

  // 파생 데이터
  const myComments = myCommentsData ?? [];
  const likedPosts = likedPostsData?.items ?? [];
  const userBio = currentUser?.profileBio ?? '';
  const profileImageUrl = currentUser?.profileImageUrl ?? '';
  const displayName = currentUser?.name ?? '사용자';
  const userEmail = currentUser?.email ?? '';
  const userPhone = currentUser?.phone ?? '';
  const profileHandle = currentUser?.profileHandle ?? currentUser?.email?.split('@')[0] ?? '';
  const followerCount = followersData?.length ?? 0;
  const followingCount = followingsData?.length ?? 0;
  // 내 게시글 필터링
  const myPosts =
    postsData?.items?.length && currentUser?.id
      ? postsData.items.filter(item => item.author?.id === currentUser.id && item.status === 'PUBLISHED')
      : [];

  return {
    accessToken,
    displayName,
    followerCount,
    followingCount,
    userEmail,
    userPhone,
    likedPosts,
    myComments,
    myPosts,
    profileImageUrl,
    profileHandle,
    userBio,
  };
};

// 내 블로그 사이드바 훅
export const usePostSidebarData = (posts: PostListItem[]) => {
  // 카테고리 목록
  const categories = useMemo(() => {
    const counter = new Map<string, { id: string; name: string; count: number }>();
    posts.forEach(post => {
      const category = post.category;
      if (!category) return;
      const existing = counter.get(category.id);
      if (existing) {
        existing.count += 1;
        return;
      }
      counter.set(category.id, { id: category.id, name: category.name, count: 1 });
    });
    return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  // 태그 목록
  const tags = useMemo(() => {
    const counter = new Map<string, { id: string; name: string; count: number }>();
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        const existing = counter.get(tag.id);
        if (existing) {
          existing.count += 1;
          return;
        }
        counter.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
      });
    });
    return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  return { categories, tags };
};

// 활동 정렬 훅
export const useActivitySort = (posts: PostListItem[], comments: MyCommentItem[]) => {
  // 정렬 상태
  const [sortKey, setSortKey] = useState<ActivitySortKey>('latest');

  // 게시글 정렬
  const sortedPosts = useMemo(() => {
    return sortPostsByKey(posts, sortKey);
  }, [posts, sortKey]);

  // 댓글 정렬
  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortKey === 'popular') {
      return list.sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          b.replyCount - a.replyCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments, sortKey]);

  // 정렬 변경
  const handleSortChange = (nextKey: ActivitySortKey) => setSortKey(nextKey);

  return {
    sortKey,
    sortedPosts,
    sortedComments,
    handleSortChange,
  };
};

// 프로필 편집 훅
export const useProfileEditor = (initialName?: string, initialHandle?: string) => {
  // 레퍼런스
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
  const handleProfileSave = async () => {
    const nextName = profileName.trim();
    const nextHandle = profileHandle.trim().replace(/^@/, '');
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nextHandle)) {
      showToast({ message: '프로필 아이디는 영문/숫자만 입력할 수 있어요.', type: 'error' });
      return;
    }
    if (!nextHandle) {
      showToast({ message: '프로필 아이디를 입력해주세요.', type: 'error' });
      return;
    }
    try {
      await updateProfile({ name: nextName, profileHandle: nextHandle });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '프로필이 저장되었습니다.', type: 'success' });
      setIsProfileEditing(false);
    } catch (error) {
      showToast({ message: '프로필 저장에 실패했습니다.', type: 'error' });
    }
  };
  // 편집 토글
  const handleProfileEditToggle = () => {
    if (!isProfileEditing) {
      setIsProfileEditing(true);
      return;
    }
    if (isProfileSaving) return;
    handleProfileSave();
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
      handleProfileEditToggle,
      handleProfileHandleChange,
      handleProfileCancel,
    },
  };
};

// 프로필 이미지 편집 훅
export const useProfileImageEditor = (initialImageUrl?: string | null, isProfileEditing?: boolean) => {
  // 레퍼런스
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

// 자기소개 편집 훅
export const useBioEditor = (userBio: string) => {
  // 레퍼런스
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutateAsync: updateMyBio, isPending: isBioUpdating } = useUpdateProfileBioMutation();
  const bioEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const bioImageInputRef = useRef<HTMLInputElement | null>(null);

  // 에디터 상태
  const [profileBio, setProfileBio] = useState('');
  const [showBioEditor, setShowBioEditor] = useState(false);

  // 미리보기
  // 미리보기 변환
  const bioPreview = useMemo(() => renderMarkdownPreview(profileBio), [profileBio]);

  // 기본값 반영
  useEffect(() => {
    setProfileBio(userBio);
  }, [userBio]);

  // 에디터 핸들러
  // 자기소개 입력
  const handleBioChange = (event: ChangeEvent<HTMLTextAreaElement>) => setProfileBio(event.target.value);
  // 편집 토글
  const handleBioToggle = () =>
    setShowBioEditor(prev => {
      if (prev) setProfileBio(userBio);
      return !prev;
    });
  // 편집기 값 갱신
  const setBioValue = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    setProfileBio(nextValue);
    window.requestAnimationFrame(() => {
      if (!bioEditorRef.current) return;
      bioEditorRef.current.focus();
      bioEditorRef.current.setSelectionRange(selectionStart, selectionEnd);
    });
  };
  // 인라인 서식 적용
  const applyInlineWrap = (prefix: string, suffix = prefix, fallback = '텍스트') => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd) || fallback;
    const nextValue = `${value.slice(0, selectionStart)}${prefix}${selectedText}${suffix}${value.slice(selectionEnd)}`;
    const nextStart = selectionStart + prefix.length;
    const nextEnd = nextStart + selectedText.length;
    setBioValue(nextValue, nextStart, nextEnd);
  };
  // 라인 서식 적용
  const applyLinePrefix = (prefix: string) => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionEnd);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
    const selectedText = value.slice(lineStart, sliceEnd);
    const nextText = selectedText
      .split('\n')
      .map(line => `${prefix}${line}`)
      .join('\n');
    const nextValue = `${value.slice(0, lineStart)}${nextText}${value.slice(sliceEnd)}`;
    setBioValue(nextValue, lineStart, lineStart + nextText.length);
  };
  // 번호 리스트 적용
  const applyNumbered = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionEnd);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
    const selectedText = value.slice(lineStart, sliceEnd);
    const nextText = selectedText
      .split('\n')
      .map((line, index) => `${index + 1}. ${line}`)
      .join('\n');
    const nextValue = `${value.slice(0, lineStart)}${nextText}${value.slice(sliceEnd)}`;
    setBioValue(nextValue, lineStart, lineStart + nextText.length);
  };
  // 제목 적용
  const applyHeading = (level: 1 | 2 | 3) => applyLinePrefix(`${'#'.repeat(level)} `);
  // 인용 적용
  const applyQuote = () => applyLinePrefix('> ');
  // 불릿 적용
  const applyBullet = () => applyLinePrefix('- ');
  // 코드 적용
  const applyCode = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd);
    if (selectedText.includes('\n')) {
      const nextValue = `${value.slice(0, selectionStart)}\n\`\`\`\n${selectedText}\n\`\`\`\n${value.slice(selectionEnd)}`;
      const cursor = selectionStart + selectedText.length + 8;
      setBioValue(nextValue, cursor, cursor);
      return;
    }
    applyInlineWrap('`', '`', '코드');
  };
  // 링크 적용
  const applyLink = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd) || '링크 텍스트';
    const nextValue = `${value.slice(0, selectionStart)}[${selectedText}](url)${value.slice(selectionEnd)}`;
    const nextStart = selectionStart + selectedText.length + 3;
    const nextEnd = nextStart + 3;
    setBioValue(nextValue, nextStart, nextEnd);
  };
  // 이미지 선택
  const handleBioImageClick = () => {
    bioImageInputRef.current?.click();
  };
  // 이미지 삽입
  const handleBioImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadsApi.uploadImage(file);
      if (!bioEditorRef.current) return;
      const { selectionStart, selectionEnd, value } = bioEditorRef.current;
      const nextValue = `${value.slice(0, selectionStart)}![이미지](${url})${value.slice(selectionEnd)}`;
      const cursor = selectionStart + url.length + 6;
      setBioValue(nextValue, cursor, cursor);
      showToast({ message: '이미지가 삽입되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '이미지 업로드에 실패했습니다.', type: 'error' });
    } finally {
      if (event.target) event.target.value = '';
    }
  };
  // 자기소개 저장
  const handleBioSave = async () => {
    if (isBioUpdating) return;
    if (profileBio === userBio) {
      showToast({ message: '변경된 내용이 없습니다.', type: 'info' });
      return;
    }
    try {
      await updateMyBio({ profileBio });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '자기소개가 저장되었습니다.', type: 'success' });
      setShowBioEditor(false);
    } catch {
      showToast({ message: '자기소개 저장에 실패했습니다.', type: 'error' });
    }
  };

  return {
    bioPreview,
    profileBio,
    showBioEditor,
    isBioUpdating,
    refs: {
      bioEditorRef,
      bioImageInputRef,
    },
    handlers: {
      handleBioChange,
      handleBioSave,
      handleBioToggle,
      handleBioImageClick,
      handleBioImageSelect,
    },
    toolbar: {
      applyBullet,
      applyCode,
      applyHeading,
      applyInlineWrap,
      applyLink,
      applyNumbered,
      applyQuote,
    },
  };
};

// 게시글 메뉴 훅
export const usePostMenu = () => {
  // 메뉴 상태
  const queryClient = useQueryClient();
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  // 삭제 뮤테이션
  const { mutateAsync: deleteMyPost, isPending: isPostDeleting } = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
  });

  // 메뉴 핸들러
  // 게시글 메뉴 토글
  const handlePostMenuToggle = (postId: string) => setOpenPostMenuId(prev => (prev === postId ? null : postId));
  // 게시글 수정 이동
  const handlePostEdit = (postId: string) => {
    window.location.href = `/posts/edit/${postId}`;
  };
  // 게시글 삭제
  const handlePostDelete = async (postId: string) => {
    const confirmed = window.confirm('게시글을 삭제할까요?');
    if (!confirmed) return;
    await deleteMyPost(postId);
    setOpenPostMenuId(null);
    await queryClient.invalidateQueries({ queryKey: postsKeys.all });
  };

  return {
    isPostDeleting,
    openPostMenuId,
    handlePostDelete,
    handlePostEdit,
    handlePostMenuToggle,
  };
};

// 댓글 편집 훅
export const useCommentEditor = () => {
  // 편집 상태
  const queryClient = useQueryClient();

  const [editingContent, setEditingContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);

  // 댓글 삭제 뮤테이션
  const { mutateAsync: deleteMyComment, isPending: isDeleting } = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      commentsApi.deleteComment(postId, commentId),
  });
  // 댓글 수정 뮤테이션
  const { mutateAsync: updateMyComment, isPending: isUpdating } = useMutation({
    mutationFn: ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      commentsApi.updateComment(postId, commentId, { content }),
  });

  // 댓글 길이 체크
  const hasEditingLengthError = editingContent.length > 1000;
  // 댓글 메뉴 토글
  const handleCommentMenuToggle = (commentId: string) =>
    setOpenCommentMenuId(prev => (prev === commentId ? null : commentId));
  // 댓글 편집 취소
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };
  // 댓글 편집 입력
  const handleEditChange = (event: ChangeEvent<HTMLTextAreaElement>) => setEditingContent(event.target.value);
  // 댓글 편집 시작
  const handleEditStart = (commentId: string, content: string) => {
    setEditingContent(content);
    setEditingCommentId(commentId);
    setOpenCommentMenuId(null);
  };
  // 댓글 편집 저장
  const handleEditSubmit = async (postId: string, commentId: string) => {
    if (!postId) return;
    const trimmed = editingContent.trim();
    if (!trimmed || hasEditingLengthError) return;
    await updateMyComment({ postId, commentId, content: trimmed });
    handleEditCancel();
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
  };
  // 댓글 삭제
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!postId) return;
    const confirmed = window.confirm('댓글을 삭제할까요?');
    if (!confirmed) return;
    await deleteMyComment({ postId, commentId });
    if (editingCommentId === commentId) {
      handleEditCancel();
    }
    setOpenCommentMenuId(null);
    await queryClient.invalidateQueries({ queryKey: commentsKeys.myList() });
  };

  return {
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
  };
};
