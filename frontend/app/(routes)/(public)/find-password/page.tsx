'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  useSendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
} from '@/app/api/auth/auth.mutations';
import { useToast } from '@/app/shared/components/toast/toast';
import { EMAIL_MESSAGES } from '@/app/shared/constants/messages/auth.message';
import { resetPasswordState, sendCode, verifyCode, resetPassword } from './find-password.handlers';

import styles from './find-password.module.css';
import type { AuthStep } from '@/app/shared/types/auth';

// 비밀번호 유효성 검사 (최소 8자, 영문+숫자+특수문자)
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const isValidPassword = (value: string) => PASSWORD_PATTERN.test(value);

// 인증번호 포맷팅 (영문+숫자만, 대문자 변환, 8자 제한)
const formatCode = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);

const formatRemainingTime = (seconds: number) => {
  const clamped = Math.max(seconds, 0);
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
};

const RESET_CODE_EXPIRY_SECONDS = 600;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  // Hooks & Mutations
  const router = useRouter();
  const sendCodeMutation = useSendResetCodeMutation();
  const verifyCodeMutation = useVerifyResetCodeMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const { showToast } = useToast();

  // Form
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI
  const [step, setStep] = useState<AuthStep>('verify');
  const [codeSent, setCodeSent] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Error
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Loading
  const isSending = sendCodeMutation.isPending;
  const isVerifying = verifyCodeMutation.isPending;
  const isResetting = resetPasswordMutation.isPending;

  // 인증번호 만료 타이머 (10분 카운트다운)
  useEffect(() => {
    if (!codeSent || remainingSeconds <= 0) return undefined;

    const timerId = window.setTimeout(() => {
      setRemainingSeconds(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [codeSent, remainingSeconds]);

  // 인증번호 만료 알림
  useEffect(() => {
    if (codeSent && remainingSeconds === 0) {
      showToast({ message: '인증번호가 만료되었습니다. 다시 발송해주세요.', type: 'warning' });
    }
  }, [codeSent, remainingSeconds, showToast]);

  // 비밀번호 상태 초기화 핸들러
  const handleResetPasswordState = resetPasswordState({
    setNewPassword,
    setConfirmPassword,
    setNewPasswordError,
    setConfirmPasswordError,
  });

  // 인증번호 발송 핸들러
  const handleSendCode = sendCode({
    email,
    setEmailError,
    setCodeError,
    setCodeSent,
    sendCodeMutation,
    showToast,
    onSendSuccess: () => {
      setRemainingSeconds(RESET_CODE_EXPIRY_SECONDS);
    },
  });

  // 인증번호 검증 핸들러
  const handleVerifyCode = verifyCode({
    email,
    code,
    setEmailError,
    setCodeError,
    setStep,
    verifyCodeMutation,
    showToast,
  });

  // 새 비밀번호 설정 핸들러
  const handleResetPassword = resetPassword({
    email,
    code,
    newPassword,
    confirmPassword,
    setNewPasswordError,
    setConfirmPasswordError,
    setCodeError,
    resetPasswordMutation,
    showToast,
    router,
    isValidPassword,
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
        <div className={styles.loginBox}>
          <h1 className={styles.title}>비밀번호 찾기</h1>

          {step === 'verify' && (
            <form onSubmit={codeSent ? handleVerifyCode : handleSendCode} className={styles.form}>
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
                    setEmail(next);
                    if (!EMAIL_REGEX.test(next)) {
                      setEmailError(EMAIL_MESSAGES.invalid);
                    } else if (emailError) {
                      setEmailError('');
                    }
                    if (codeError) setCodeError('');
                  }}
                  className={emailError ? `${styles.input} ${styles.error}` : styles.input}
                  disabled={isSending || isVerifying || codeSent}
                  placeholder="example@email.com"
                  autoComplete="username"
                />
                {emailError && <p className={styles.errorMessage}>{emailError}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="code" className={styles.label}>
                  인증번호
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={e => {
                      setCode(formatCode(e.target.value));
                      if (codeError) setCodeError('');
                    }}
                    className={
                      codeError
                        ? `${styles.input} ${styles.error} ${styles.inputWithTimer}`
                        : `${styles.input} ${styles.inputWithTimer}`
                    }
                    disabled={!codeSent || isVerifying}
                    placeholder="8자리 인증번호"
                    maxLength={8}
                    autoComplete="one-time-code"
                  />
                  {codeSent && remainingSeconds > 0 && (
                    <span className={styles.timerInline} aria-live="polite">
                      {formatRemainingTime(remainingSeconds)}
                    </span>
                  )}
                </div>
                {codeError && <p className={styles.errorMessage}>{codeError}</p>}
              </div>
              <div className={styles.footer}>
                <div className={styles.links}>
                  <Link href="/login" className={styles.link} tabIndex={-1}>
                    로그인
                  </Link>
                  <span className={styles.separator}>|</span>
                  <Link href="/register" className={styles.link} tabIndex={-1}>
                    회원가입
                  </Link>
                  {codeSent && (
                    <>
                      <span className={styles.separator}>|</span>
                      <button
                        type="button"
                        className={`${styles.link} ${styles.linkButton}`}
                        disabled={isSending || isVerifying}
                        onClick={() => {
                          handleSendCode();
                        }}
                      >
                        재전송
                      </button>
                    </>
                  )}
                </div>
                <button type="submit" className={styles.submitButton} disabled={isSending || isVerifying}>
                  {!codeSent
                    ? isSending
                      ? '발송 중...'
                      : '인증번호 발송'
                    : isVerifying
                    ? '확인 중...'
                    : '인증번호 확인'}
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={e => {
                    const value = e.target.value;
                    setNewPassword(value);
                    if (value && !isValidPassword(value)) {
                      setNewPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
                    } else {
                      setNewPasswordError('');
                    }
                  }}
                  className={
                    newPasswordError
                      ? `${styles.input} ${styles.passwordInput} ${styles.error}`
                      : `${styles.input} ${styles.passwordInput}`
                  }
                  disabled={isResetting}
                  placeholder="최소 8자 이상"
                  autoComplete="new-password"
                />
                {newPasswordError && <p className={styles.errorMessage}>{newPasswordError}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  className={
                    confirmPasswordError
                      ? `${styles.input} ${styles.passwordInput} ${styles.error}`
                      : `${styles.input} ${styles.passwordInput}`
                  }
                  disabled={isResetting}
                  placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                />
                {confirmPasswordError && <p className={styles.errorMessage}>{confirmPasswordError}</p>}
              </div>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.backButton}
                  tabIndex={-1}
                  onClick={() => {
                    setStep('verify');
                    handleResetPasswordState();
                  }}
                >
                  이전으로
                </button>
                <button type="submit" className={styles.submitButton} disabled={isResetting}>
                  {isResetting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
