import { useQuery } from '@tanstack/react-query';

import { followsApi } from './follows.api';
import { followsKeys } from './follows.keys';

import type { FollowListResponse } from '@/app/shared/types/follow';

type QueryOptions = {
  enabled?: boolean;
};

export const useFollowersQuery = (options?: QueryOptions) => {
  return useQuery<FollowListResponse, Error>({
    queryKey: followsKeys.followers(),
    queryFn: () => followsApi.getFollowers(),
    enabled: options?.enabled ?? true,
  });
};

export const useFollowingsQuery = (options?: QueryOptions) => {
  return useQuery<FollowListResponse, Error>({
    queryKey: followsKeys.followings(),
    queryFn: () => followsApi.getFollowings(),
    enabled: options?.enabled ?? true,
  });
};
