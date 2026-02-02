'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TOAST_CONFIG } from '@/app/shared/constants/config/toast.config';

import { ToastCard } from './ToastCard';
import { ToastContext } from './ToastContext';

import styles from './toast.module.css';

import type { ToastItem, ToastOptions } from '@/app/shared/types/toast';

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
