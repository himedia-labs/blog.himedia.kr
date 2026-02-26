import type { TabKey } from '@/app/shared/types/mypage';

/**
 * 탭 판별
 * @description 쿼리 탭 값을 허용 목록으로 제한
 */
export const getInitialTab = (value?: string | null, defaultTab: TabKey = 'posts') => {
  if (
    value === 'comments' ||
    value === 'likes' ||
    value === 'posts' ||
    value === 'settings' ||
    value === 'account'
  ) {
    return value;
  }
  return defaultTab;
};
