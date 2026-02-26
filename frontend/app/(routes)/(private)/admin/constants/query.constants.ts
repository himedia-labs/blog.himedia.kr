export const ADMIN_QUERY_KEYS = {
  TAB: 'tab',
  SORT: 'sort',
} as const;

export const ADMIN_TAB_QUERY_VALUE = {
  PENDING_USERS: 'pending',
  USERS: 'users',
  AUDIT_LOGS: 'audit',
  ACCESS_LOGS: 'access',
} as const;

export const ADMIN_SORT_QUERY_VALUE = {
  OLDEST: 'oldest',
  NEWEST: 'newest',
  ROLE_ASC: 'role-asc',
  ROLE_DESC: 'role-desc',
  COURSE_ASC: 'course-asc',
  COURSE_DESC: 'course-desc',
} as const;
