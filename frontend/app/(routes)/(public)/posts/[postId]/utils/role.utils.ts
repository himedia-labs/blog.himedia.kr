import type { UserRole } from '@/app/shared/types/post';

/**
 * 역할 변환
 * @description 사용자 역할을 한글로 변환
 */
export const formatRole = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    TRAINEE: '훈련생',
    GRADUATE: '수료생',
    MENTOR: '멘토',
    INSTRUCTOR: '강사',
    ADMIN: '관리자',
  };
  return roleMap[role] ?? '훈련생';
};
