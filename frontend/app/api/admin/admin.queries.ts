import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/app/api/admin/admin.api';
import { adminKeys } from '@/app/api/admin/admin.keys';

import type { AdminAuditLogsResponse, AdminPendingUsersResponse, AdminReportsResponse } from '@/app/shared/types/admin';

// 관리자 신고 목록 조회
export const useAdminReportsQuery = (enabled: boolean) => {
  return useQuery<AdminReportsResponse, Error>({
    queryKey: adminKeys.reports(),
    queryFn: adminApi.getReports,
    enabled,
  });
};

// 관리자 승인 대기 회원 조회
export const useAdminPendingUsersQuery = (enabled: boolean) => {
  return useQuery<AdminPendingUsersResponse, Error>({
    queryKey: adminKeys.pendingUsers(),
    queryFn: adminApi.getPendingUsers,
    enabled,
  });
};

// 관리자 감사로그 조회
export const useAdminAuditLogsQuery = (enabled: boolean) => {
  return useQuery<AdminAuditLogsResponse, Error>({
    queryKey: adminKeys.auditLogs(),
    queryFn: adminApi.getAuditLogs,
    enabled,
  });
};
