import { IconType } from 'react-icons';

/**
 * 네비 아이템 타입
 * @description 헤더 네비게이션 항목 구조를 정의
 */
export type NavItem = {
  label: string;
  href?: string;
  Icon?: IconType;
  isAuthDependent?: boolean;
};

/**
 * 헤더 프롭스
 * @description 헤더 컴포넌트 입력값을 정의
 */
export interface HeaderProps {
  initialIsLoggedIn: boolean;
}
