import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { adminApi } from '@/app/api/admin/admin.api';
import { adminKeys } from '@/app/api/admin/admin.keys';

import type {
  AdminAccessLogsResponse,
  AdminAuditLogsResponse,
  AdminPendingUsersResponse,
  AdminReportsResponse,
  AdminUsersResponse,
} from '@/app/shared/types/admin';

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

// 관리자 전체 회원 조회
export const useAdminUsersQuery = (enabled: boolean) => {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminKeys.users(),
    queryFn: adminApi.getUsers,
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

// 관리자 접속일지 조회
export const useAdminAccessLogsQuery = (enabled: boolean) => {
  return useInfiniteQuery<AdminAccessLogsResponse, Error>({
    queryKey: adminKeys.accessLogs(),
    queryFn: ({ pageParam }) => adminApi.getAccessLogs(Number(pageParam ?? 1)),
    initialPageParam: 1,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
  });
};
