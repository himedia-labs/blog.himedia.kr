import { useEffect, useState } from 'react';

import { formatPhone } from './register.handlers';
import { sessionStorage } from '@/app/shared/utils/session-storage';

import type { RegisterFormCache } from '@/app/shared/types/register';

// 폼 캐시 세션 키
const FORM_CACHE_KEY = 'registerFormCache';
// 약관 페이지 이동 시 보존 플래그 키
const FORM_CACHE_KEEP_KEY = 'registerFormCacheKeep';

// 폼 기본값
const DEFAULT_FORM_CACHE: RegisterFormCache = {
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  phone: '',
  role: '',
  course: '',
  privacyConsent: false,
};

/**
 * 회원가입 폼 상태/캐시/핸들러 훅
 * @description 입력 필드/에러 상태, 전화번호 포맷터, 이메일 입력 필터 제공, 세션스토리지에 폼 값을 저장/복원 (약관 페이지 이동 시만 보존)
 */

export const useRegisterForm = () => {
  const [form, setForm] = useState<RegisterFormCache>(() => sessionStorage.getItem(FORM_CACHE_KEY, DEFAULT_FORM_CACHE));
  const [hasCache, setHasCache] = useState(() => sessionStorage.hasItem(FORM_CACHE_KEY));
  const [restoredFromKeep] = useState<boolean>(() => sessionStorage.hasItem(FORM_CACHE_KEEP_KEY));

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  // 폼 필드 업데이트 헬퍼
  const setFormField = <K extends keyof RegisterFormCache>(key: K, value: RegisterFormCache[K]) =>
    setForm(prev => {
      setHasCache(prevHasCache => (prevHasCache ? prevHasCache : true));
      return { ...prev, [key]: value };
    });

  // 캐시 삭제 + 폼 초기화
  const clearFormCache = () => {
    sessionStorage.removeItem(FORM_CACHE_KEY);
    sessionStorage.removeItem(FORM_CACHE_KEEP_KEY);
    setForm(DEFAULT_FORM_CACHE);
    setHasCache(false);
  };

  // 세션 스토리지 캐시 저장
  useEffect(() => {
    sessionStorage.setItem(FORM_CACHE_KEY, form);
  }, [form]);

  /**
   * - 플래그 생성: 약관 페이지 이동 시 세션 스토리지에 플래그 저장
   * - 플래그 삭제: 약관에서 돌아올 때 이 플래그 키를 삭제하고, 다른 페이지로 이동 시 플래그가 없으면 폼 캐시 삭제
   */
  useEffect(() => {
    if (restoredFromKeep) {
      sessionStorage.removeItem(FORM_CACHE_KEEP_KEY);
    }

    return () => {
      if (!sessionStorage.hasItem(FORM_CACHE_KEEP_KEY)) {
        sessionStorage.removeItem(FORM_CACHE_KEY);
      }
      setHasCache(false);
    };
  }, [restoredFromKeep]);

  // 전화번호 포맷 핸들러
  const handlePhoneChange = formatPhone({
    setPhone: value => setFormField('phone', value),
    phoneError,
    setPhoneError,
  });

  return {
    form,
    setFormField,
    errors: {
      nameError,
      emailError,
      passwordError,
      passwordConfirmError,
      phoneError,
      roleError,
      courseError,
      privacyError,
    },
    setErrors: {
      setNameError,
      setEmailError,
      setPasswordError,
      setPasswordConfirmError,
      setPhoneError,
      setRoleError,
      setCourseError,
      setPrivacyError,
    },
    handlers: {
      handlePhoneChange,
      clearFormCache,
      // 약관 페이지 이동 시 캐시 보존 플래그 설정
      markKeepCache: () => sessionStorage.setItem(FORM_CACHE_KEEP_KEY, '1'),
    },
    hasCache,
    restoredFromKeep,
  };
};

export default useRegisterForm;
