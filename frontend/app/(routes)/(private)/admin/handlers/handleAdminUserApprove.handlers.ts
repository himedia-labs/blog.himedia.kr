import { adminKeys } from '@/app/api/admin/admin.keys';

import type { QueryClient } from '@tanstack/react-query';

/**
 * 회원 승인 핸들러
 * @description 승인 처리 후 승인대기/감사로그 쿼리를 갱신
 */
export const handleAdminUserApprove = async (params: {
  userId: string;
  queryClient: QueryClient;
  mutateAsync: (userId: string) => Promise<unknown>;
}) => {
  await params.mutateAsync(params.userId);
  await params.queryClient.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
  await params.queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
};
