import { ToastIcon } from './ToastIcon';

import styles from './toast.module.css';

import type { ToastItem } from '@/app/shared/types/toast';

/**
 * 토스트 카드
 * @description 단일 토스트 메시지를 렌더링
 */
export function ToastCard({ toast }: { toast: ToastItem }) {
  const isMultiline = toast.message.includes('\n');
  return (
    <div
      className={`${styles.toast} ${toast.leaving ? styles.leaving : ''} ${isMultiline ? styles.multiline : ''}`}
      role="status"
      aria-live="polite"
    >
      <ToastIcon type={toast.type ?? 'info'} />
      <div className={styles.message}>{toast.message}</div>
      {toast.actions && toast.actions.length > 0 && (
        <div className={styles.actions}>
          {toast.actions.map(action => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className={`${styles.actionButton} ${action.className ? styles[action.className] : ''}`}
                onClick={action.onClick}
                aria-label={action.ariaLabel ?? action.label}
              >
                {action.label}
                {ActionIcon && <ActionIcon aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
