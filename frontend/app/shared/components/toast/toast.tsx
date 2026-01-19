'use client';

import { IconType } from 'react-icons';
import { IoMdCheckmark } from 'react-icons/io';
import { AiOutlineInfo } from 'react-icons/ai';
import { TbExclamationMark } from 'react-icons/tb';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { TOAST_CONFIG } from '../../constants/config/toast.config';

import styles from './toast.module.css';
import type { ToastContextValue, ToastItem, ToastOptions, ToastType } from '../../types/toast';

// 토스트 표시/닫기를 제공하는 컨텍스트
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// 토스트 타입별 아이콘 스타일 매핑
const iconStyles: Record<ToastType, { bg: string; color: string }> = {
  info: { bg: '#e7eefc', color: '#3050a6' },
  success: { bg: '#e7f6ec', color: '#15803d' },
  warning: { bg: '#ffdf8f', color: '#333D4B' },
  error: { bg: '#ffe4e6', color: '#b91c1c' },
};

// 토스트 타입별 아이콘 매핑
const iconMap: Record<ToastType, IconType> = {
  info: AiOutlineInfo,
  success: IoMdCheckmark,
  warning: TbExclamationMark,
  error: TbExclamationMark,
};

// 토스트 타입별 아이콘/배경색 렌더
function ToastIcon({ type }: { type: ToastType }) {
  const Icon = iconMap[type];
  const { bg, color } = iconStyles[type];
  return (
    <span className={styles.icon} style={{ backgroundColor: bg, color }}>
      <Icon aria-hidden focusable="false" strokeWidth={2.5} />
    </span>
  );
}

// 단일 토스트 카드 렌더
function ToastCard({ toast }: { toast: ToastItem }) {
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

// 토스트 컨텍스트 제공 및 큐 관리
/**
 * 토스트 프로바이더
 * @description 토스트 상태를 관리하고 UI를 렌더링
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  // 토스트 자동 종료 예약
  const scheduleAutoExit = useCallback((toast: ToastItem, exit: (id: string) => void) => {
    if (toast.duration === null) return;
    const duration =
      typeof toast.duration === 'number' && toast.duration > 0 ? toast.duration : TOAST_CONFIG.defaultDurationMs;
    if (duration <= 0) return;
    timersRef.current[toast.id] = window.setTimeout(() => exit(toast.id), duration);
  }, []);

  // 토스트 퇴장 처리: leaving 플래그 후 애니메이션 끝에 제거
  const startExit = useCallback((id: string) => {
    const existingTimer = timersRef.current[id];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      delete timersRef.current[id];
    }

    setToasts(prev => {
      const target = prev.find(toast => toast.id === id);
      if (!target || target.leaving) return prev;
      return prev.map(toast => (toast.id === id ? { ...toast, leaving: true } : toast));
    });

    window.setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      const timer = timersRef.current[id];
      if (timer) {
        window.clearTimeout(timer);
        delete timersRef.current[id];
      }
    }, TOAST_CONFIG.exitDurationMs);
  }, []);

  // 새 토스트 표시
  const showToast = useCallback(
    ({ message, type = 'warning', duration = TOAST_CONFIG.defaultDurationMs, actions }: ToastOptions) => {
      const id = crypto?.randomUUID?.() ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newToast = { id, message, type, duration, actions };

      setToasts(prev => {
        if (prev.length >= TOAST_CONFIG.maxToasts) return prev;

        if (TOAST_CONFIG.resetOnNewToast) {
          prev.forEach(existing => {
            const existingTimer = timersRef.current[existing.id];
            if (existingTimer) window.clearTimeout(existingTimer);
            scheduleAutoExit(existing, startExit);
          });
        }

        scheduleAutoExit(newToast, startExit);
        return [...prev, newToast];
      });
    },
    [scheduleAutoExit, startExit],
  );

  const contextValue = useMemo(() => ({ showToast, hideToast: startExit }), [showToast, startExit]);

  // 제거된 토스트의 타이머 정리
  useEffect(() => {
    const activeIds = new Set(toasts.map(t => t.id));
    Object.keys(timersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        window.clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });
  }, [toasts]);

  // 언마운트 시 타이머 정리
  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(window.clearTimeout);
      timersRef.current = {};
    },
    [],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * 토스트 훅
 * @description 토스트 컨텍스트를 사용
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
