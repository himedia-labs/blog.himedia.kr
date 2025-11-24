'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';

import { useRegisterMutation } from '@/app/api/auth/auth.mutations';
import { handleAuthError } from '@/app/api/auth/auth.error';
import styles from './register.module.css';

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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [course, setCourse] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [privacyError, setPrivacyError] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');

    if (value.length <= 11) {
      let formatted = value;
      if (value.length > 3 && value.length <= 7) {
        formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
      } else if (value.length > 7) {
        formatted = `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7, 11)}`;
      }
      setPhone(formatted);
      if (phoneError) setPhoneError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!name) {
      setNameError('이름을 입력해주세요.');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (!passwordConfirm) {
      setPasswordConfirmError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    } else {
      setPasswordConfirmError('');
    }

    if (!phone) {
      setPhoneError('전화번호를 입력해주세요.');
      hasError = true;
    } else {
      setPhoneError('');
    }

    if (!role) {
      setRoleError('역할을 선택해주세요.');
      hasError = true;
    } else {
      setRoleError('');
    }

    if (!privacyConsent) {
      setPrivacyError(true);
      hasError = true;
    } else {
      setPrivacyError(false);
    }

    if (hasError) return;

    // 전화번호에서 공백 제거
    const phoneNumber = phone.replace(/\s/g, '');

    // role을 대문자로 변환
    const upperRole = role.toUpperCase() as 'TRAINEE' | 'MENTOR' | 'INSTRUCTOR';

    registerMutation.mutate(
      {
        name,
        email,
        password,
        phone: phoneNumber,
        role: upperRole,
        course: course || undefined,
        privacyConsent,
      },
      {
        onSuccess: () => {
          router.push('/');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '회원가입에 실패했습니다.');
          setEmailError(message);
        },
      }
    );
  };

  return (
    <div className={styles.container}>
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
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              className={nameError ? `${styles.input} ${styles.error}` : styles.input}
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
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              className={emailError ? `${styles.input} ${styles.error}` : styles.input}
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
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className={passwordError ? `${styles.input} ${styles.error}` : styles.input}
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
                setPasswordConfirm(e.target.value);
                if (passwordConfirmError) setPasswordConfirmError('');
              }}
              className={passwordConfirmError ? `${styles.input} ${styles.error}` : styles.input}
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
                  setRole(e.target.value);
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
              <select id="course" value={course} onChange={e => setCourse(e.target.value)} className={styles.select}>
                <option value="">선택해주세요</option>
                {COURSE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <IoIosArrowDown className={styles.selectIcon} aria-hidden />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.consentWrapper}>
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxBox}>
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={e => {
                      setPrivacyConsent(e.target.checked);
                      if (privacyError) setPrivacyError(false);
                    }}
                    className={styles.checkbox}
                  />
                  <FaCheck className={styles.checkboxIcon} aria-hidden />
                </label>
                <div className={`${styles.checkboxText} ${privacyError ? styles.checkboxTextError : ''}`}>
                  <Link href="/terms/privacy" className={styles.link}>
                    [필수] 개인정보 수집 및 이용동의
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
  );
}
