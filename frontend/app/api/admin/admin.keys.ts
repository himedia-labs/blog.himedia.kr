export const adminKeys = {
  all: ['admin'] as const,
  reports: () => [...adminKeys.all, 'reports'] as const,
  myReports: () => [...adminKeys.all, 'my-reports'] as const,
  pendingUsers: () => [...adminKeys.all, 'pending-users'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  auditLogs: () => [...adminKeys.all, 'audit-logs'] as const,
  accessLogs: () => [...adminKeys.all, 'access-logs'] as const,
};
