import { axiosInstance } from '@/app/shared/network/axios.instance';

import type {
  AdminAuditLogsResponse,
  AdminPendingUsersResponse,
  AdminReportsResponse,
  UpdateAdminReportStatusRequest,
} from '@/app/shared/types/admin';

// 관리자 신고 목록 조회
const getReports = async () => {
  const res = await axiosInstance.get<AdminReportsResponse>('/admin/reports');
  return res.data;
};

// 관리자 승인 대기 회원 조회
const getPendingUsers = async () => {
  const res = await axiosInstance.get<AdminPendingUsersResponse>('/admin/users/pending', { params: { limit: 30 } });
  return res.data;
};

// 관리자 신고 상태 변경
const updateReportStatus = async (payload: UpdateAdminReportStatusRequest) => {
  const { reportId, status } = payload;
  const res = await axiosInstance.patch(`/admin/reports/${reportId}/status`, { status });
  return res.data;
};

// 관리자 회원 승인
const approveUser = async (userId: string) => {
  const res = await axiosInstance.patch(`/admin/users/${userId}/approve`);
  return res.data;
};

// 관리자 감사로그 조회
const getAuditLogs = async () => {
  const res = await axiosInstance.get<AdminAuditLogsResponse>('/admin/audit-logs', { params: { limit: 20 } });
  return res.data;
};

export const adminApi = {
  approveUser,
  getReports,
  getPendingUsers,
  getAuditLogs,
  updateReportStatus,
};
