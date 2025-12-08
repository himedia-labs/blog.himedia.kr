'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useLoginMutation } from '@/app/api/auth/auth.mutations';
import { handleAuthError } from '@/app/api/auth/auth.error';
import { useToast } from '@/app/shared/components/toast/toast';
import { authKeys } from '@/app/api/auth/auth.keys';

import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    }

    if (hasError) return;

    loginMutation.mutate(
      {
        email,
        password,
      },
      {
        onSuccess: data => {
          queryClient.setQueryData(authKeys.currentUser, data.user);
          router.push('/');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '로그인에 실패했습니다.');

          if (message.includes('이메일')) {
            setEmailError(message);
          } else if (message.includes('비밀번호')) {
            setPasswordError(message);
          } else {
            showToast({ message, type: 'warning' });
          }
        },
      },
    );
  };

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

          <form onSubmit={handleSubmit} className={styles.form}>
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
                className={passwordError ? `${styles.input} ${styles.error}` : styles.input}
                autoComplete="current-password"
              />
              {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
            </div>

            <div className={styles.footer}>
              <div className={styles.links}>
                <Link href="/register" className={styles.link}>
                  회원가입
                </Link>
                <span className={styles.separator}>|</span>
                <Link href="/find-password" className={styles.link}>
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
