export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
  profile: (handle: string) => ['auth', 'profile', handle] as const,
};
