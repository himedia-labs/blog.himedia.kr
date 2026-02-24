import { ADMIN_ROLE_LABEL_MAP } from '@/app/(routes)/(private)/admin/constants/role.constants';

/**
 * 역할 라벨 변환
 * @description 내부 role 값을 한글 라벨로 변환
 */
export const formatRoleLabel = (role: string | null | undefined) => {
  if (!role) return '-';
  return ADMIN_ROLE_LABEL_MAP[role] ?? role;
};
