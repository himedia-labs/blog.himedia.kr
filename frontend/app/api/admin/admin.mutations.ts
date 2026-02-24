import { useMutation } from '@tanstack/react-query';

import { adminApi } from '@/app/api/admin/admin.api';

import type { UpdateAdminReportStatusRequest } from '@/app/shared/types/admin';

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
