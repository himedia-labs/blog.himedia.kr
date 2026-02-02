import {
  HiOutlineBold,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCodeBracket,
  HiOutlineH1,
  HiOutlineH2,
  HiOutlineH3,
  HiOutlineItalic,
  HiOutlineLink,
  HiOutlineListBullet,
  HiOutlineNumberedList,
  HiOutlinePhoto,
  HiOutlineStrikethrough,
  HiOutlineUnderline,
} from 'react-icons/hi2';

import type { ToolbarItem } from '@/app/shared/types/post';

/**
 * 에디터 툴바 설정
 * @description 마크다운 서식 버튼 구성을 정의
 */
export const TOOLBAR_ITEMS: ToolbarItem[] = [
  { type: 'heading', level: 1, icon: HiOutlineH1, label: '제목 1' },
  { type: 'heading', level: 2, icon: HiOutlineH2, label: '제목 2' },
  { type: 'heading', level: 3, icon: HiOutlineH3, label: '제목 3' },
  { type: 'separator' },
  { type: 'action', action: 'bold', icon: HiOutlineBold, label: '굵게' },
  { type: 'action', action: 'italic', icon: HiOutlineItalic, label: '기울임' },
  { type: 'action', action: 'underline', icon: HiOutlineUnderline, label: '밑줄' },
  { type: 'action', action: 'strike', icon: HiOutlineStrikethrough, label: '취소선' },
  { type: 'separator' },
  { type: 'action', action: 'quote', icon: HiOutlineChatBubbleLeftRight, label: '인용' },
  { type: 'action', action: 'code', icon: HiOutlineCodeBracket, label: '코드' },
  { type: 'separator' },
  { type: 'action', action: 'link', icon: HiOutlineLink, label: '링크' },
  { type: 'action', action: 'image', icon: HiOutlinePhoto, label: '이미지' },
  { type: 'separator' },
  { type: 'action', action: 'bullet', icon: HiOutlineListBullet, label: '불릿 리스트' },
  { type: 'action', action: 'numbered', icon: HiOutlineNumberedList, label: '번호 리스트' },
];
