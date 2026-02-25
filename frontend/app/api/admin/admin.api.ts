import { axiosInstance } from '@/app/shared/network/axios.instance';

import type {
  AdminAccessLogsResponse,
  AdminAuditLogsResponse,
  AdminMyReportsResponse,
  AdminPendingUsersResponse,
  AdminReportsResponse,
  AdminUsersResponse,
  CreateAdminReportRequest,
  UpdateAdminReportStatusRequest,
  UpdateAdminUserRoleRequest,
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

// 관리자 전체 회원 조회
const getUsers = async () => {
  const res = await axiosInstance.get<AdminUsersResponse>('/admin/users', { params: { limit: 200 } });
  return res.data;
};

// 관리자 신고 상태 변경
const updateReportStatus = async (payload: UpdateAdminReportStatusRequest) => {
  const { reportId, status } = payload;
  const res = await axiosInstance.patch(`/admin/reports/${reportId}/status`, { status });
  return res.data;
};

// 버그 제보 생성
const createReport = async (payload: CreateAdminReportRequest) => {
  const res = await axiosInstance.post('/reports', payload);
  return res.data;
};

// 내 신고 목록 조회
const getMyReports = async () => {
  const res = await axiosInstance.get<AdminMyReportsResponse>('/reports/me', { params: { limit: 50 } });
  return res.data;
};

// 관리자 회원 승인
const approveUser = async (userId: string) => {
  const res = await axiosInstance.patch(`/admin/users/${userId}/approve`);
  return res.data;
};

// 관리자 회원 역할 변경
const updateUserRole = async (payload: UpdateAdminUserRoleRequest) => {
  const { userId, role } = payload;
  const res = await axiosInstance.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
};

// 관리자 감사로그 조회
const getAuditLogs = async () => {
  const res = await axiosInstance.get<AdminAuditLogsResponse>('/admin/audit-logs', { params: { limit: 20 } });
  return res.data;
};

// 관리자 접속일지 조회
const getAccessLogs = async (page = 1) => {
  const res = await axiosInstance.get<AdminAccessLogsResponse>('/admin/access-logs', { params: { limit: 30, page } });
  return res.data;
};

// 관리자 접속 기록
const trackAccessLog = async () => {
  const res = await axiosInstance.post('/admin/access-logs');
  return res.data;
};

export const adminApi = {
  approveUser,
  updateUserRole,
  getReports,
  getPendingUsers,
  getUsers,
  getAuditLogs,
  getAccessLogs,
  createReport,
  getMyReports,
  trackAccessLog,
  updateReportStatus,
};
