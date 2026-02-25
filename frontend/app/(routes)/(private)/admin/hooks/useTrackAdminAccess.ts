import { useEffect, useRef } from 'react';

import { adminKeys } from '@/app/api/admin/admin.keys';

import type { QueryClient } from '@tanstack/react-query';

/**
 * 관리자 접속 기록 훅
 * @description 관리자 첫 진입 시 접속 로그를 1회 기록하고 목록 캐시를 갱신
 */
export const useTrackAdminAccess = (params: {
  canAccess: boolean;
  queryClient: QueryClient;
  mutate: (payload: undefined, options: { onSuccess: () => Promise<void> }) => void;
}) => {
  const { canAccess, mutate, queryClient } = params;
  const hasTrackedAccessRef = useRef(false);

  useEffect(() => {
    if (!canAccess || hasTrackedAccessRef.current) return;
    hasTrackedAccessRef.current = true;
    mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: adminKeys.accessLogs() });
      },
    });
  }, [canAccess, mutate, queryClient]);
};
