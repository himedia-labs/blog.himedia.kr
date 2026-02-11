import type { ReactNode } from 'react';

export type ActionModalProps = {
  body: ReactNode;
  leftAction?: ReactNode;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmVariant?: 'primary' | 'danger';
  confirmLabel: string;
  cancelLabel: string;
  cancelBorderless?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  closeOnOverlayClick?: boolean;
};
