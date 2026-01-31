import { useEffect, useState } from 'react';

import {
  REGISTER_FORM_CACHE_KEY,
  REGISTER_FORM_CACHE_KEEP_KEY,
  REGISTER_FORM_DEFAULT,
} from '@/app/shared/constants/config/register.config';
import { sessionStorage } from '@/app/shared/utils/session-storage';

import { formatPhone } from '@/app/(routes)/(public)/register/utils';

import type { RegisterFormCache } from '@/app/shared/types/register';

/**
 * 회원가입 : 폼 상태 훅
 * @description 폼 입력 상태와 캐시 동기화를 관리
 */
export const useRegisterForm = () => {
  // 폼 상태
  const [form, setForm] = useState<RegisterFormCache>(() =>
    sessionStorage.getItem(REGISTER_FORM_CACHE_KEY, REGISTER_FORM_DEFAULT),
  );
  const [hasCache, setHasCache] = useState(() => sessionStorage.hasItem(REGISTER_FORM_CACHE_KEY));
  const [restoredFromKeep] = useState<boolean>(() => sessionStorage.hasItem(REGISTER_FORM_CACHE_KEEP_KEY));

  // 에러 상태
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  // 폼 필드 업데이트
  const setFormField = <K extends keyof RegisterFormCache>(key: K, value: RegisterFormCache[K]) =>
    setForm(prev => {
      setHasCache(prevHasCache => (prevHasCache ? prevHasCache : true));
      return { ...prev, [key]: value };
    });

  // 캐시 삭제 + 폼 초기화
  const clearFormCache = () => {
    sessionStorage.removeItem(REGISTER_FORM_CACHE_KEY);
    sessionStorage.removeItem(REGISTER_FORM_CACHE_KEEP_KEY);
    setForm(REGISTER_FORM_DEFAULT);
    setHasCache(false);
  };

  // 세션 스토리지 캐시 저장
  useEffect(() => {
    sessionStorage.setItem(REGISTER_FORM_CACHE_KEY, form);
  }, [form]);

  // 약관 페이지 이동 시 플래그 저장, 이탈 시 캐시 정리
  useEffect(() => {
    if (restoredFromKeep) {
      sessionStorage.removeItem(REGISTER_FORM_CACHE_KEEP_KEY);
    }

    return () => {
      if (!sessionStorage.hasItem(REGISTER_FORM_CACHE_KEEP_KEY)) {
        sessionStorage.removeItem(REGISTER_FORM_CACHE_KEY);
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
      birthDateError,
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
      setBirthDateError,
      setRoleError,
      setCourseError,
      setPrivacyError,
    },
    handlers: {
      handlePhoneChange,
      clearFormCache,
      // 약관 페이지 이동 시 캐시 보존 플래그 설정
      markKeepCache: () => sessionStorage.setItem(REGISTER_FORM_CACHE_KEEP_KEY, '1'),
    },
    hasCache,
    restoredFromKeep,
  };
};
