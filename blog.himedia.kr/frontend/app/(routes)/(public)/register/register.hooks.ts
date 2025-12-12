import { useEffect, useState } from 'react';

import { formatPhone } from './register.handlers';
import sanitizeEmailInput from '@/app/shared/utils/email';

import type { RegisterFormCache } from '@/app/shared/types/register';

const FORM_CACHE_KEY = 'registerFormCache';
const FORM_CACHE_KEEP_KEY = 'registerFormCacheKeep';

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

// 세션에 저장된 폼 데이터 로드 (파싱 실패 시 기본값)
const loadCachedForm = (): RegisterFormCache => {
  if (typeof window === 'undefined') return DEFAULT_FORM_CACHE;
  const raw = sessionStorage.getItem(FORM_CACHE_KEY);
  if (!raw) return DEFAULT_FORM_CACHE;
  try {
    const cached = JSON.parse(raw) as Partial<RegisterFormCache>;
    return { ...DEFAULT_FORM_CACHE, ...cached };
  } catch {
    return DEFAULT_FORM_CACHE;
  }
};

/**
 * 회원가입 폼 상태/캐시/핸들러 훅
 * @description 입력 필드/에러 상태, 전화번호 포맷터, 이메일 입력 필터 제공, 세션스토리지에 폼 값을 저장/복원 (약관 페이지 이동 시만 보존)
 */

export const useRegisterForm = () => {
  const [form, setForm] = useState<RegisterFormCache>(() => loadCachedForm());
  const [hasCache, setHasCache] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(FORM_CACHE_KEY);
  });
  const [restoredFromKeep] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(FORM_CACHE_KEEP_KEY);
  });
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [privacyError, setPrivacyError] = useState(false);

  // 폼 필드 업데이트 헬퍼
  const setFormField = <K extends keyof RegisterFormCache>(key: K, value: RegisterFormCache[K]) =>
    setForm(prev => {
      setHasCache(prevHasCache => (prevHasCache ? prevHasCache : true));
      return { ...prev, [key]: value };
    });

  // 캐시 삭제 + 폼 초기화
  const clearFormCache = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(FORM_CACHE_KEY);
    sessionStorage.removeItem(FORM_CACHE_KEEP_KEY);
    setForm(DEFAULT_FORM_CACHE);
    setHasCache(false);
  };

  // 세션 스토리지 캐시 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = { ...form };
    sessionStorage.setItem(FORM_CACHE_KEY, JSON.stringify(payload));
  }, [form]);

  // 이전 화면에서 keep 플래그로 돌아온 경우, 플래그는 소비(삭제)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (restoredFromKeep) {
      sessionStorage.removeItem(FORM_CACHE_KEEP_KEY);
    }
  }, [restoredFromKeep]);

  // 페이지 이탈 시 캐시 삭제 (terms/privacy 이동 시에는 keep 플래그로 보존)
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      const keep = sessionStorage.getItem(FORM_CACHE_KEEP_KEY);
      if (!keep) {
        sessionStorage.removeItem(FORM_CACHE_KEY);
      }
      setHasCache(false);
    };
  }, []);

  // 전화번호 포맷 핸들러
  const handlePhoneChange = formatPhone({
    phone: form.phone,
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
      markKeepCache: () => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(FORM_CACHE_KEEP_KEY, '1');
      },
      sanitizeEmailInput,
    },
    hasCache,
    restoredFromKeep,
  };
};

export default useRegisterForm;
