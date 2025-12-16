'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FaCheck } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { TbExternalLink } from 'react-icons/tb';

import useRegisterForm from './register.hooks';
import { register } from './register.handlers';
import { isValidPassword } from '@/app/shared/utils/password';
import { EMAIL_MESSAGES } from '@/app/shared/constants/messages/auth';
import { useRegisterMutation } from '@/app/api/auth/auth.mutations';
import { useToast } from '@/app/shared/components/toast/toast';

import styles from './register.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 교육과정 리스트 (임시 데이터)
const COURSE_OPTIONS = [
  '프론트엔드 개발자 양성과정 1기',
  '프론트엔드 개발자 양성과정 2기',
  '백엔드 개발자 양성과정 1기',
  '백엔드 개발자 양성과정 2기',
  '풀스택 개발자 양성과정 1기',
  '풀스택 개발자 양성과정 2기',
  'AI 개발자 양성과정 1기',
  'AI 개발자 양성과정 2기',
  '데이터 분석 양성과정 1기',
  '데이터 분석 양성과정 2기',
  '기타',
];

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const { showToast } = useToast();
  const restoredToastShownRef = useRef(false);

  // 폼 상태/핸들러(캐시 로드 및 저장, 전화번호 포맷 등 포함)
  const {
    form,
    setFormField,
    errors,
    setErrors,
    handlers: { handlePhoneChange, clearFormCache, markKeepCache },
    hasCache,
    restoredFromKeep,
  } = useRegisterForm();

  // 폼 입력값 상태
  const { name, email, password, passwordConfirm, phone, role, course, privacyConsent } = form;
  // 폼 에러 상태
  const {
    nameError,
    emailError,
    passwordError,
    passwordConfirmError,
    phoneError,
    roleError,
    courseError,
    privacyError,
  } = errors;
  // 에러 세터 모음
  const {
    setNameError,
    setEmailError,
    setPasswordError,
    setPasswordConfirmError,
    setPhoneError,
    setRoleError,
    setCourseError,
    setPrivacyError,
  } = setErrors;

  // 약관 페이지에서 돌아왔을 때 캐시 로드 안내 토스트
  useEffect(() => {
    if (hasCache && restoredFromKeep && !restoredToastShownRef.current) {
      showToast({ message: '임시 저장된 내용을 불러왔습니다.', type: 'info' });
      restoredToastShownRef.current = true;
    }
  }, [hasCache, restoredFromKeep, showToast]);

  // 회원가입 핸들러
  const handleSubmit = register({
    name,
    email,
    password,
    passwordConfirm,
    phone,
    role,
    course,
    privacyConsent,
    setNameError,
    setEmailError,
    setPasswordError,
    setPasswordConfirmError,
    setPhoneError,
    setRoleError,
    setCourseError,
    setPrivacyError,
    registerMutation,
    showToast,
    router,
    onSuccessCleanup: clearFormCache,
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandMark}>
              <Image src="/icon/logo.png" alt="하이미디어아카데미 로고" fill priority sizes="90px" draggable={false} />
            </span>
            <span className={styles.brandText}>
              하이미디어커뮤니티
              <span className={styles.brandSub}>HIMEDIA COMMUNITY</span>
            </span>
          </Link>
        </div>
        <div className={styles.signupBox}>
          <h1 className={styles.title}>회원가입</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => {
                  setFormField('name', e.target.value);
                  if (nameError) setNameError('');
                }}
                className={nameError ? `${styles.input} ${styles.error}` : styles.input}
                autoComplete="name"
              />
              {nameError && <p className={styles.errorMessage}>{nameError}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                이메일 주소
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => {
                  const next = e.target.value;
                  setFormField('email', next);
                  if (!EMAIL_REGEX.test(next)) {
                    setEmailError(EMAIL_MESSAGES.invalid);
                  } else if (emailError) {
                    setEmailError('');
                  }
                }}
                className={emailError ? `${styles.input} ${styles.error}` : styles.input}
                autoComplete="username"
              />
              {emailError && <p className={styles.errorMessage}>{emailError}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => {
                  const value = e.target.value;
                  setFormField('password', value);
                  if (value && !isValidPassword(value)) {
                    setPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
                  } else {
                    setPasswordError('');
                  }
                }}
                className={passwordError ? `${styles.input} ${styles.error}` : styles.input}
                autoComplete="new-password"
              />
              {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passwordConfirm" className={styles.label}>
                비밀번호 확인
              </label>
              <input
                type="password"
                id="passwordConfirm"
                value={passwordConfirm}
                onChange={e => {
                  setFormField('passwordConfirm', e.target.value);
                  if (passwordConfirmError) setPasswordConfirmError('');
                }}
                onBlur={() => {
                  // 에러 메시지는 백엔드에서만 표시
                  if (passwordConfirmError) {
                    setPasswordConfirmError('');
                  }
                }}
                className={passwordConfirmError ? `${styles.input} ${styles.error}` : styles.input}
                autoComplete="new-password"
              />
              {passwordConfirmError && <p className={styles.errorMessage}>{passwordConfirmError}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className={phoneError ? `${styles.input} ${styles.error}` : styles.input}
                placeholder="010 1234 5678"
                maxLength={13}
                autoComplete="tel"
              />
              {phoneError && <p className={styles.errorMessage}>{phoneError}</p>}
            </div>

            <hr className={styles.divider} />

            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.label}>
                역할
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="role"
                  value={role}
                  onChange={e => {
                    setFormField('role', e.target.value);
                    if (roleError) setRoleError('');
                  }}
                  className={roleError ? `${styles.select} ${styles.error}` : styles.select}
                >
                  <option value="">선택해주세요</option>
                  <option value="trainee">훈련생</option>
                  <option value="mentor">멘토</option>
                  <option value="instructor">강사</option>
                </select>
                <IoIosArrowDown className={styles.selectIcon} aria-hidden />
              </div>
              {roleError && <p className={styles.errorMessage}>{roleError}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="course" className={styles.label}>
                과정명 및 기수
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="course"
                  value={course}
                  onChange={e => {
                    setFormField('course', e.target.value);
                    if (courseError) setCourseError('');
                  }}
                  className={courseError ? `${styles.select} ${styles.error}` : styles.select}
                >
                  <option value="">선택해주세요</option>
                  {COURSE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className={styles.selectIcon} aria-hidden />
              </div>
              {courseError && <p className={styles.errorMessage}>{courseError}</p>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.consentWrapper}>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxBox}>
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={e => {
                        setFormField('privacyConsent', e.target.checked);
                        if (privacyError) setPrivacyError('');
                      }}
                      className={styles.checkbox}
                    />
                    <FaCheck className={styles.checkboxIcon} aria-hidden />
                  </label>
                  <div className={`${styles.checkboxText} ${privacyError ? styles.checkboxTextError : ''}`}>
                    <Link
                      href="/terms/privacy"
                      className={`${styles.link} ${styles.consentLink}`}
                      onClick={() => {
                        if (name || email || password || phone || role || course || passwordConfirm) {
                          markKeepCache();
                          showToast({ message: '입력한 내용이 임시 저장되었습니다.', type: 'info' });
                        }
                      }}
                    >
                      <span>[필수] 개인정보 수집 및 이용동의</span>
                      <TbExternalLink aria-hidden className={styles.consentIcon} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.links}>
                <Link href="/login" className={styles.link}>
                  이미 계정이 있으신가요?
                </Link>
              </div>
              <button type="submit" className={styles.submitButton}>
                회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
