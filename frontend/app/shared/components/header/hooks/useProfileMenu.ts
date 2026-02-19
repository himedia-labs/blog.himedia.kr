import { useEffect, useRef, useState } from 'react';

/**
 * 프로필 메뉴 훅
 * @description 프로필 드롭다운 메뉴 상태와 핸들러를 관리
 */
export const useProfileMenu = (isLoggedIn: boolean) => {
  // UI 상태
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const isMenuOpen = isLoggedIn && isProfileOpen;
  const isMenuVisible = isLoggedIn && isProfileVisible;

  // UI 참조
  const profileRef = useRef<HTMLDivElement | null>(null);

  // 프로필 메뉴 핸들러
  const openProfileMenu = () => {
    if (!isLoggedIn) return;
    setIsProfileVisible(true);
    setIsProfileOpen(true);
  };

  const closeProfileMenu = () => {
    setIsProfileOpen(false);
    setTimeout(() => setIsProfileVisible(false), 160);
  };

  const toggleProfileMenu = (closeOtherMenus: () => void) => {
    if (!isLoggedIn) return;
    closeOtherMenus();
    if (isMenuOpen) {
      closeProfileMenu();
      return;
    }
    openProfileMenu();
  };

  // 외부 클릭/ESC 키 처리
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current || profileRef.current.contains(event.target as Node)) return;
      closeProfileMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProfileMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return {
    profileRef,
    isProfileOpen: isMenuOpen,
    isProfileVisible: isMenuVisible,
    toggleProfileMenu,
    closeProfileMenu,
  };
};
