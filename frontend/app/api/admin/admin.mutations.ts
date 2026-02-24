import { useMutation } from '@tanstack/react-query';

import { adminApi } from '@/app/api/admin/admin.api';

import type { UpdateAdminReportStatusRequest, UpdateAdminUserRoleRequest } from '@/app/shared/types/admin';

// 관리자 신고 상태 변경
export const useUpdateAdminReportStatusMutation = () => {
  return useMutation<unknown, Error, UpdateAdminReportStatusRequest>({
    mutationFn: adminApi.updateReportStatus,
  });
};

// 관리자 회원 승인
export const useApproveAdminUserMutation = () => {
  return useMutation<unknown, Error, string>({
    mutationFn: adminApi.approveUser,
  });
};

// 관리자 회원 역할 변경
export const useUpdateAdminUserRoleMutation = () => {
  return useMutation<unknown, Error, UpdateAdminUserRoleRequest>({
    mutationFn: adminApi.updateUserRole,
  });
};

// 관리자 접속 기록
export const useTrackAdminAccessMutation = () => {
  return useMutation<unknown, Error, void>({
    mutationFn: adminApi.trackAccessLog,
  });
};
