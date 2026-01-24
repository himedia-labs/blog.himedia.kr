import { axiosInstance } from '@/app/shared/network/axios.instance';

type FollowResponse = {
  following: boolean;
};

const followUser = async (userId: string): Promise<FollowResponse> => {
  const res = await axiosInstance.post<FollowResponse>(`/follows/${userId}`);
  return res.data;
};

const unfollowUser = async (userId: string): Promise<FollowResponse> => {
  const res = await axiosInstance.delete<FollowResponse>(`/follows/${userId}`);
  return res.data;
};

export const followsApi = {
  followUser,
  unfollowUser,
};
