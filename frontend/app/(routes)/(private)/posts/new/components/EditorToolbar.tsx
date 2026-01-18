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

import styles from '../PostCreate.module.css';

import type { EditorToolbarProps, ToolbarItem } from '@/app/shared/types/post';

// 툴바 버튼 설정
const TOOLBAR_ITEMS: ToolbarItem[] = [
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

export default function EditorToolbar(handlers: EditorToolbarProps) {
  // 핸들러 매핑
  const actionsMap = {
    code: handlers.onCode,
    link: handlers.onLink,
    bold: handlers.onBold,
    quote: handlers.onQuote,
    image: handlers.onImage,
    strike: handlers.onStrike,
    bullet: handlers.onBullet,
    italic: handlers.onItalic,
    numbered: handlers.onNumbered,
    underline: handlers.onUnderline,
  };

  return (
    <div className={styles.headingToolbar} role="group" aria-label="서식 도구">
      {TOOLBAR_ITEMS.map((item, index) => {
        if (item.type === 'separator') {
          return <span key={`separator-${index}`} className={styles.headingSeparator} aria-hidden="true" />;
        }

        const Icon = item.icon;
        const onClick = item.type === 'heading' ? () => handlers.onHeading(item.level) : actionsMap[item.action];

        return (
          <button
            key={`${item.type}-${item.label}`}
            type="button"
            className={styles.headingButton}
            aria-label={item.label}
            onClick={onClick}
          >
            <Icon aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
