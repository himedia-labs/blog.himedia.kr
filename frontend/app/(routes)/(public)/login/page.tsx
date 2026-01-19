'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useLoginMutation } from '@/app/api/auth/auth.mutations';
import { useToast } from '@/app/shared/components/toast/toast';
import { EMAIL_REGEX } from '@/app/shared/constants/limits/auth.limit';
import { EMAIL_MESSAGES } from '@/app/shared/constants/messages/auth.message';

import { authenticateUser } from './login.handlers';
import { useLoginRedirectToast } from './login.hooks';

import styles from './login.module.css';

/**
 * 로그인 페이지
 * @description 이메일/비밀번호 로그인을 처리
 */
export default function LoginPage() {
  // 라우트/쿼리
  const router = useRouter();
  const searchParams = useSearchParams();

  const reason = searchParams.get('reason');
  const redirectParam = searchParams.get('redirect');
  const redirectTo = redirectParam?.startsWith('/') ? redirectParam : '/';

  // 공통 훅
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 에러 상태
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 로그인 핸들러
  const handleLogin = authenticateUser({
    email,
    password,
    setEmailError,
    setPasswordError,
    redirectTo,
    loginMutation,
    showToast,
    queryClient,
    authKeys,
    router,
  });

  // 리다이렉트 안내
  useLoginRedirectToast({ reason, showToast });

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
        <div className={styles.loginBox}>
          <h1 className={styles.title}>로그인</h1>

          <form onSubmit={handleLogin} className={styles.form}>
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
                  const next = e.target.value;
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
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={
                  passwordError
                    ? `${styles.input} ${styles.passwordInput} ${styles.error}`
                    : `${styles.input} ${styles.passwordInput}`
                }
                autoComplete="current-password"
              />
              {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
            </div>

            <div className={styles.footer}>
              <div className={styles.links}>
                <Link href="/register" className={styles.link} tabIndex={-1}>
                  회원가입
                </Link>
                <span className={styles.separator}>|</span>
                <Link href="/find-password" className={styles.link} tabIndex={-1}>
                  비밀번호 찾기
                </Link>
              </div>
              <button type="submit" className={styles.submitButton}>
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
