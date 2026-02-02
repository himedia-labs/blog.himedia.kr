import { createContext } from 'react';

import type { ToastContextValue } from '@/app/shared/types/toast';

/**
 * 토스트 컨텍스트
 * @description 토스트 표시/닫기 함수를 제공
 */
export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
