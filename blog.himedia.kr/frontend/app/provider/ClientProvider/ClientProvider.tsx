'use client';

import { useAuthInitialize } from '@/app/api/auth/auth.hooks';
import { ClientProviderProps } from './ClientProvider.types';

export default function ClientProvider({ children }: ClientProviderProps) {
  useAuthInitialize();
  return <>{children}</>;
}
