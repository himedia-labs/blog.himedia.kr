'use client';

import styles from './ActionModal.module.css';

import type { MouseEvent } from 'react';
import type { ActionModalProps } from '@/app/shared/types/modal';

/**
 * 액션 모달
 * @description 확인/취소 액션과 커스텀 콘텐츠를 지원하는 공용 모달
 */
export default function ActionModal({
  body,
  leftAction,
  title,
  onClose,
  onConfirm,
  confirmVariant = 'primary',
  confirmLabel,
  cancelLabel,
  cancelBorderless = false,
  confirmDisabled = false,
  cancelDisabled = false,
  closeOnOverlayClick = true,
}: ActionModalProps) {
  /**
   * 오버레이 클릭
   * @description 바깥 영역 클릭 시 모달을 닫는다
   */
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick) return;
    if (event.target !== event.currentTarget) return;

    onClose();
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{body}</div>
        <div className={styles.buttons}>
          <div className={styles.leftActions}>{leftAction}</div>
          <div className={styles.rightActions}>
            <button
              type="button"
              className={`${styles.buttonSecondary} ${cancelBorderless ? styles.buttonSecondaryBorderless : ''}`}
              disabled={cancelDisabled}
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`${styles.buttonPrimary} ${confirmVariant === 'danger' ? styles.buttonPrimaryDanger : ''}`}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
