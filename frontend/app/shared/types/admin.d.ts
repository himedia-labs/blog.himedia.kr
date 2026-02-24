export type AdminReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface AdminReport {
  id: string;
  title: string;
  content: string;
  status: AdminReportStatus;
  reporterUserId: string | null;
  handlerAdminId: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportsResponse {
  items: AdminReport[];
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  targetType: string;
  targetId: string;
  action: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminAuditLogsResponse {
  items: AdminAuditLog[];
}

export interface AdminPendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  requestedRole: 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR' | null;
  role: 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR' | 'ADMIN';
  course: string | null;
  approved: boolean;
  createdAt: string;
}

export interface AdminPendingUsersResponse {
  items: AdminPendingUser[];
}

export interface UpdateAdminReportStatusRequest {
  reportId: string;
  status: AdminReportStatus;
}
