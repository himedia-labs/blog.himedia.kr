import { adminKeys } from '@/app/api/admin/admin.keys';
import { notificationsKeys } from '@/app/api/notifications/notifications.keys';

import type { QueryClient } from '@tanstack/react-query';
import type { AdminReportStatus } from '@/app/shared/types/admin';

/**
 * 신고 상태 변경 핸들러
 * @description 신고 상태를 업데이트하고 관련 쿼리를 갱신
 */
export const handleAdminReportStatusChange = async (params: {
  reportId: string;
  status: AdminReportStatus;
  queryClient: QueryClient;
  mutateAsync: (payload: { reportId: string; status: AdminReportStatus }) => Promise<unknown>;
}) => {
  await params.mutateAsync({ reportId: params.reportId, status: params.status });
  await params.queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
  await params.queryClient.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
  await params.queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
  await params.queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
};
