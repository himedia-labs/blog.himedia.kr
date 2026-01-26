export const followsKeys = {
  all: ['follows'] as const,
  followers: () => [...followsKeys.all, 'followers'] as const,
  followings: () => [...followsKeys.all, 'followings'] as const,
};
