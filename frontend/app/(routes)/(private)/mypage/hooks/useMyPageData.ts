import { useMemo } from 'react';

import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { useMyCommentsQuery } from '@/app/api/comments/comments.queries';
import { useFollowersQuery, useFollowingsQuery } from '@/app/api/follows/follows.queries';
import { useLikedPostsQuery, usePostsQuery } from '@/app/api/posts/posts.queries';
import { useAuthStore } from '@/app/shared/store/authStore';

/**
 * 마이페이지 데이터 훅
 * @description 내 정보/활동 데이터를 조회하고 파생값을 구성
 */
export const useMyPageData = () => {
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
  const myPosts = useMemo(() => {
    if (!postsData?.items?.length || !currentUser?.id) return [];
    return postsData.items.filter(item => item.author?.id === currentUser.id && item.status === 'PUBLISHED');
  }, [currentUser?.id, postsData?.items]);

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
