export const adminKeys = {
  all: ['admin'] as const,
  reports: () => [...adminKeys.all, 'reports'] as const,
  pendingUsers: () => [...adminKeys.all, 'pending-users'] as const,
  auditLogs: () => [...adminKeys.all, 'audit-logs'] as const,
};
