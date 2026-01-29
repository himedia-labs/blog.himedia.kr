export const MYPAGE_TABS = [
  { key: 'settings', label: '내 정보', href: '/mypage' },
  { key: 'posts', label: '내 블로그', href: '/mypage?tab=posts' },
  { key: 'comments', label: '남긴 댓글', href: '/mypage?tab=comments' },
  { key: 'likes', label: '좋아한 포스트', href: '/mypage?tab=likes' },
  { key: 'account', label: '계정 설정', href: '/mypage?tab=account' },
] as const;

