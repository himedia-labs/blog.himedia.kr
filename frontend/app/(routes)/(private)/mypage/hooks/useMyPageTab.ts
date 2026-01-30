import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { getInitialTab } from '@/app/(routes)/(private)/mypage/utils';

import type { TabKey } from '@/app/shared/types/mypage';

/**
 * 마이페이지 탭 훅
 * @description 왼쪽 사이드 바의 "현재 선택된 메뉴(탭)" 상태 관리
 */
export const useMyPageTab = (defaultTab: TabKey) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab(searchParams.get('tab'), defaultTab));

  useEffect(() => {
    setActiveTab(getInitialTab(searchParams.get('tab'), defaultTab));
  }, [defaultTab, searchParams]);

  return activeTab;
};
