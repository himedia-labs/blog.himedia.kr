'use client';

import { useState } from 'react';

import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

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

    if (hasError) return;

    // 로그인 처리
  };

  return (
    <div className={styles.container}>
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

          <div className={styles.footer}>
            <div className={styles.links}>
              <a href="/signup" className={styles.link}>
                회원가입
              </a>
              <span className={styles.separator}>|</span>
              <a href="/find-password" className={styles.link}>
                비밀번호 찾기
              </a>
            </div>
            <button type="submit" className={styles.submitButton}>
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
