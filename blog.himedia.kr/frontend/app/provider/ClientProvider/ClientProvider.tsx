'use client';

import { useAuthInitialize } from '@/app/shared/hooks/useAuthInitialize';
import { ClientProviderProps } from './ClientProvider.types';

export default function ClientProvider({ children }: ClientProviderProps) {
  useAuthInitialize();
  return <>{children}</>;
}
