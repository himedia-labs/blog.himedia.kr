import { ADMIN_MENU_LABELS } from '@/app/(routes)/(private)/admin/constants/menu.constants';
import { ADMIN_PENDING_SORT } from '@/app/(routes)/(private)/admin/constants/sort.constants';

export type AdminMenuLabel = (typeof ADMIN_MENU_LABELS)[keyof typeof ADMIN_MENU_LABELS];
export type AdminPendingSort = (typeof ADMIN_PENDING_SORT)[keyof typeof ADMIN_PENDING_SORT];
