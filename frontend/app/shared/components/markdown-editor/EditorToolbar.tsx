import { TOOLBAR_ITEMS } from '@/app/shared/constants/config/editor-toolbar.config';

import styles from '@/app/shared/styles/markdownEditor.module.css';

import type { EditorToolbarProps } from '@/app/shared/types/post';

/**
 * 에디터 툴바
 * @description 마크다운 서식 버튼을 렌더링하고 클릭 이벤트를 연결
 */
export default function EditorToolbar(handlers: EditorToolbarProps) {
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
