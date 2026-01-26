import type { UserRole } from './post';

export interface FollowUserItem {
  id: string;
  name: string;
  role: UserRole;
  isMutual: boolean;
}

export type FollowListResponse = FollowUserItem[];

export interface FollowToggleResponse {
  following: boolean;
}
