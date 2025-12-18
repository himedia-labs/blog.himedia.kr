'use client';
import { IconType } from 'react-icons';
import { IoMdCheckmark } from 'react-icons/io';
import { AiOutlineInfo } from 'react-icons/ai';
import { TbExclamationMark } from 'react-icons/tb';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

const MAX_TOASTS = 3; // 최대 표시 토스트 수
const exitDuration = 260; // 토스트 퇴장 애니메이션 시간 (ms)
const defaultDuration: number = 3500; // 기본 자동 종료 시간 (ms)
const resetOnNewToast = true; // 새 토스트가 뜰 때 기존 토스트 타이머 리셋 여부

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

// 단일 토스트 카드 렌더 + 닫기 버튼
function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  return (
    <div className={`${styles.toast} ${toast.leaving ? styles.leaving : ''}`} role="status" aria-live="polite">
      <ToastIcon type={toast.type ?? 'info'} />
      <div className={styles.message}>{toast.message}</div>
      <button type="button" className={styles.close} aria-label="토스트 닫기" onClick={() => onClose(toast.id)}>
        ×
      </button>
    </div>
  );
}

// 토스트 컨텍스트 제공 및 큐 관리
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  // 토스트 자동 종료 예약
  const scheduleAutoExit = useCallback((toast: ToastItem, exit: (id: string) => void) => {
    if (typeof toast.duration !== 'number' || toast.duration <= 0) return;
    timersRef.current[toast.id] = window.setTimeout(() => exit(toast.id), toast.duration);
  }, []);

  // 토스트 퇴장 처리: leaving 플래그 후 애니메이션 끝에 제거
  const startExit = useCallback((id: string) => {
    // 기존 자동 종료 타이머가 있으면 즉시 해제
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
      setToasts(prev => {
        const filtered = prev.filter(toast => toast.id != id);
        const timer = timersRef.current[id];
        if (timer) {
          window.clearTimeout(timer);
          delete timersRef.current[id];
        }

        return filtered;
      });
    }, exitDuration);
  }, []);

  // 새 토스트 표시
  const showToast = useCallback(
    ({ message, type = 'warning', duration = defaultDuration }: ToastOptions) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newToast = { id, message, type, duration };

      setToasts(prev => {
        // 최대 표시 수 초과 시, 신규 토스트는 무시
        if (prev.length >= MAX_TOASTS) {
          return prev;
        }

        // 새 토스트 추가 시 기존 토스트 타이머를 리셋해 마지막 토스트 이후 duration 동안 유지
        if (resetOnNewToast) {
          prev.forEach(existing => {
            const existingTimer = timersRef.current[existing.id];
            if (existingTimer) {
              window.clearTimeout(existingTimer);
            }
            scheduleAutoExit(existing, startExit);
          });
        }

        // 새 토스트 자동 종료 설정 후 추가
        scheduleAutoExit(newToast, startExit);
        return [...prev, newToast];
      });
    },
    [scheduleAutoExit, startExit],
  );

  const contextValue = useMemo(() => ({ showToast, hideToast: startExit }), [showToast, startExit]);

  // 제거된 토스트의 타이머 정리
  useEffect(() => {
    Object.keys(timersRef.current).forEach(id => {
      if (!toasts.find(toast => toast.id === id)) {
        const timerId = timersRef.current[id];
        window.clearTimeout(timerId);
        delete timersRef.current[id];
      }
    });
  }, [toasts]);

  // 언마운트 시 타이머 정리
  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(timerId => window.clearTimeout(timerId));
      timersRef.current = {};
    },
    [],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onClose={startExit} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
