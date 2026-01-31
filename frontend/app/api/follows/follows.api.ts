import { axiosInstance } from '@/app/shared/network/axios.instance';

import type { FollowListResponse, FollowToggleResponse } from '@/app/shared/types/follow';

// 팔로우
const followUser = async (userId: string): Promise<FollowToggleResponse> => {
  const res = await axiosInstance.post<FollowToggleResponse>(`/follows/${userId}`);
  return res.data;
};

// 언팔로우
const unfollowUser = async (userId: string): Promise<FollowToggleResponse> => {
  const res = await axiosInstance.delete<FollowToggleResponse>(`/follows/${userId}`);
  return res.data;
};

// 팔로워 목록 조회
const getFollowers = async (): Promise<FollowListResponse> => {
  const res = await axiosInstance.get<FollowListResponse>('/follows/me/followers');
  return res.data;
};

// 팔로잉 목록 조회
const getFollowings = async (): Promise<FollowListResponse> => {
  const res = await axiosInstance.get<FollowListResponse>('/follows/me/followings');
  return res.data;
};

export const followsApi = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings,
};
