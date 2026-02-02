import { CiBellOn, CiSearch } from 'react-icons/ci';

import type { NavItem } from '@/app/shared/types/header';

/**
 * 헤더 설정
 * @description 헤더 링크/메뉴 구성을 정의
 */
const NAV_ITEMS: NavItem[] = [
  { label: '알림', Icon: CiBellOn },
  { label: '검색', Icon: CiSearch },
  { label: '로그인/프로필', isAuthDependent: true },
];

export const HeaderConfig = {
  postDetailExcludeExactPaths: ['/posts/new'],
  postDetailExcludePrefixes: ['/posts/drafts'],
  navItems: NAV_ITEMS,
};
