import { ADMIN_MENU_LABELS } from '@/app/(routes)/(private)/admin/constants/menu.constants';
import { ADMIN_PENDING_SORT } from '@/app/(routes)/(private)/admin/constants/sort.constants';
import { ADMIN_SORT_QUERY_VALUE, ADMIN_TAB_QUERY_VALUE } from '@/app/(routes)/(private)/admin/constants/query.constants';

import type { AdminMenuLabel, AdminPendingSort } from '@/app/(routes)/(private)/admin/constants/admin.types';

/**
 * 탭 쿼리 파싱
 * @description tab 쿼리 문자열을 관리자 메뉴 라벨로 변환
 */
export const parseAdminMenuFromQuery = (value: string | null): AdminMenuLabel => {
  if (value === ADMIN_TAB_QUERY_VALUE.USERS) return ADMIN_MENU_LABELS.USERS;
  if (value === ADMIN_TAB_QUERY_VALUE.REPORTS) return ADMIN_MENU_LABELS.REPORTS;
  if (value === ADMIN_TAB_QUERY_VALUE.AUDIT_LOGS) return ADMIN_MENU_LABELS.AUDIT_LOGS;
  if (value === ADMIN_TAB_QUERY_VALUE.ACCESS_LOGS) return ADMIN_MENU_LABELS.ACCESS_LOGS;
  return ADMIN_MENU_LABELS.PENDING_USERS;
};

/**
 * 정렬 쿼리 파싱
 * @description sort 쿼리 문자열을 승인대기 정렬 값으로 변환
 */
export const parseAdminSortFromQuery = (value: string | null): AdminPendingSort => {
  if (value === ADMIN_SORT_QUERY_VALUE.ROLE_ASC || value === 'role') return ADMIN_PENDING_SORT.ROLE_ASC;
  if (value === ADMIN_SORT_QUERY_VALUE.ROLE_DESC) return ADMIN_PENDING_SORT.ROLE_DESC;
  if (value === ADMIN_SORT_QUERY_VALUE.COURSE_ASC || value === 'course') return ADMIN_PENDING_SORT.COURSE_ASC;
  if (value === ADMIN_SORT_QUERY_VALUE.COURSE_DESC) return ADMIN_PENDING_SORT.COURSE_DESC;
  if (value === ADMIN_SORT_QUERY_VALUE.NEWEST) return ADMIN_PENDING_SORT.NEWEST;
  return ADMIN_PENDING_SORT.OLDEST;
};

/**
 * 탭 쿼리 직렬화
 * @description 관리자 메뉴 라벨을 tab 쿼리 문자열로 변환
 */
export const serializeAdminMenuToQuery = (menu: AdminMenuLabel) => {
  if (menu === ADMIN_MENU_LABELS.USERS) return ADMIN_TAB_QUERY_VALUE.USERS;
  if (menu === ADMIN_MENU_LABELS.REPORTS) return ADMIN_TAB_QUERY_VALUE.REPORTS;
  if (menu === ADMIN_MENU_LABELS.AUDIT_LOGS) return ADMIN_TAB_QUERY_VALUE.AUDIT_LOGS;
  if (menu === ADMIN_MENU_LABELS.ACCESS_LOGS) return ADMIN_TAB_QUERY_VALUE.ACCESS_LOGS;
  return ADMIN_TAB_QUERY_VALUE.PENDING_USERS;
};

/**
 * 정렬 쿼리 직렬화
 * @description 승인대기 정렬 값을 sort 쿼리 문자열로 변환
 */
export const serializeAdminSortToQuery = (sort: AdminPendingSort) => {
  if (sort === ADMIN_PENDING_SORT.ROLE_ASC) return ADMIN_SORT_QUERY_VALUE.ROLE_ASC;
  if (sort === ADMIN_PENDING_SORT.ROLE_DESC) return ADMIN_SORT_QUERY_VALUE.ROLE_DESC;
  if (sort === ADMIN_PENDING_SORT.COURSE_ASC) return ADMIN_SORT_QUERY_VALUE.COURSE_ASC;
  if (sort === ADMIN_PENDING_SORT.COURSE_DESC) return ADMIN_SORT_QUERY_VALUE.COURSE_DESC;
  if (sort === ADMIN_PENDING_SORT.NEWEST) return ADMIN_SORT_QUERY_VALUE.NEWEST;
  return ADMIN_SORT_QUERY_VALUE.OLDEST;
};
