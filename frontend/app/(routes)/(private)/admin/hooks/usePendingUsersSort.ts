import { useMemo } from 'react';

import { ADMIN_PENDING_SORT } from '@/app/(routes)/(private)/admin/constants/sort.constants';

import type { AdminPendingSort } from '@/app/(routes)/(private)/admin/constants/admin.types';
import type { AdminPendingUser } from '@/app/shared/types/admin';

/**
 * 승인대기 회원 정렬
 * @description 정렬 옵션에 따라 승인대기 회원 목록을 정렬해 반환
 */
export const usePendingUsersSort = (pendingUsers: AdminPendingUser[], pendingSort: AdminPendingSort) => {
  return useMemo(() => {
    const copiedUsers = [...pendingUsers];
    const sortByTime = (a: AdminPendingUser, b: AdminPendingUser) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const roleOrderMap: Record<string, number> = {
      TRAINEE: 0,
      GRADUATE: 1,
      MENTOR: 2,
      INSTRUCTOR: 3,
      ADMIN: 4,
    };
    if (pendingSort === ADMIN_PENDING_SORT.OLDEST) return copiedUsers.sort(sortByTime);
    if (pendingSort === ADMIN_PENDING_SORT.ROLE_ASC || pendingSort === ADMIN_PENDING_SORT.ROLE_DESC) {
      return copiedUsers.sort((a, b) => {
        const aRole = a.requestedRole ?? a.role;
        const bRole = b.requestedRole ?? b.role;
        const aOrder = roleOrderMap[aRole ?? 'TRAINEE'] ?? 99;
        const bOrder = roleOrderMap[bRole ?? 'TRAINEE'] ?? 99;
        if (aOrder !== bOrder) {
          if (pendingSort === ADMIN_PENDING_SORT.ROLE_DESC) return bOrder - aOrder;
          return aOrder - bOrder;
        }
        return sortByTime(a, b);
      });
    }
    if (pendingSort === ADMIN_PENDING_SORT.COURSE_ASC || pendingSort === ADMIN_PENDING_SORT.COURSE_DESC) {
      return copiedUsers.sort((a, b) => {
        const aCourse = (a.course ?? 'N/A').trim();
        const bCourse = (b.course ?? 'N/A').trim();
        if (aCourse === 'N/A' && bCourse !== 'N/A') return 1;
        if (aCourse !== 'N/A' && bCourse === 'N/A') return -1;
        const compareResult = aCourse.localeCompare(bCourse, 'ko');
        if (compareResult !== 0) {
          if (pendingSort === ADMIN_PENDING_SORT.COURSE_DESC) return compareResult * -1;
          return compareResult;
        }
        return sortByTime(a, b);
      });
    }
    return copiedUsers.sort((a, b) => sortByTime(b, a));
  }, [pendingSort, pendingUsers]);
};
