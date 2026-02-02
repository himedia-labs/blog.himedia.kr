'use client';

import { useAuthInitialize } from '@/app/shared/hooks/useAuthInitialize';

/**
 * 인증 초기화 컴포넌트
 * @description 앱이 처음 실행될 때 인증 초기화 훅을 한 번 호출해 로그인 상태를 맞춘다
 */
export default function AuthInitializer() {
  useAuthInitialize();
  return null;
}
