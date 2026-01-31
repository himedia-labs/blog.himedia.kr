import { useQuery } from '@tanstack/react-query';

import { followsApi } from '@/app/api/follows/follows.api';
import { followsKeys } from '@/app/api/follows/follows.keys';

import type { FollowListResponse, FollowsQueryOptions } from '@/app/shared/types/follow';

// 내 팔로워 조회
export const useFollowersQuery = (options?: FollowsQueryOptions) => {
  return useQuery<FollowListResponse, Error>({
    queryKey: followsKeys.followers(),
    queryFn: () => followsApi.getFollowers(),
    enabled: options?.enabled ?? true,
  });
};

// 내 팔로잉 조회
export const useFollowingsQuery = (options?: FollowsQueryOptions) => {
  return useQuery<FollowListResponse, Error>({
    queryKey: followsKeys.followings(),
    queryFn: () => followsApi.getFollowings(),
    enabled: options?.enabled ?? true,
  });
};
