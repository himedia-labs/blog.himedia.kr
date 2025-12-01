'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  useSendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
} from '@/app/api/auth/auth.mutations';
import { handleAuthError } from '@/app/api/auth/auth.error';
import { useToast } from '@/app/shared/components/toast/ToastProvider';

import styles from './searchPassword.module.css';
import type { AuthStep } from './searchPassword.types';

const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const isValidPassword = (value: string) => PASSWORD_PATTERN.test(value);
const formatCode = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const sendCodeMutation = useSendResetCodeMutation();
  const verifyCodeMutation = useVerifyResetCodeMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<AuthStep>('verify');
  const [codeSent, setCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { showToast } = useToast();

  const isSending = sendCodeMutation.isPending;
  const isVerifying = verifyCodeMutation.isPending;
  const isResetting = resetPasswordMutation.isPending;

  const resetPasswordState = () => {
    setNewPassword('');
    setConfirmPassword('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  // 인증번호 발송
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError('');
    setCodeError('');

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }

    sendCodeMutation.mutate(
      { email },
      {
        onSuccess: data => {
          showToast({ message: data.message, type: 'success' });
          setCodeSent(true);
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '인증번호 발송에 실패했습니다.');

          if (message.includes('이메일')) {
            setEmailError(message);
          } else {
            showToast({ message, type: 'error' });
          }
        },
      },
    );
  };

  // 인증번호 검증
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError('');
    setCodeError('');

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }

    if (!code) {
      setCodeError('인증번호를 입력해주세요.');
      return;
    }

    verifyCodeMutation.mutate(
      { email, code },
      {
        onSuccess: data => {
          showToast({ message: data.message, type: 'success' });
          setStep('password');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '인증번호 확인에 실패했습니다.');

          if (message.includes('인증번호')) {
            setCodeError(message);
          } else if (message.includes('이메일')) {
            setEmailError(message);
          } else {
            showToast({ message, type: 'warning' });
          }
        },
      },
    );
  };

  // 새 비밀번호 입력
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    // 에러 초기화
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    // 필수 입력 체크만 수행
    if (!newPassword) {
      setNewPasswordError('새 비밀번호를 입력해주세요.');
      hasError = true;
    } else if (!isValidPassword(newPassword)) {
      setNewPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    if (hasError) return;

    resetPasswordMutation.mutate(
      { email, code, newPassword },
      {
        onSuccess: data => {
          showToast({ message: data.message, type: 'success' });
          router.push('/login');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '비밀번호 재설정에 실패했습니다.');

          // 백엔드 에러 메시지를 각 필드에 맞게 설정
          if (message.includes('비밀번호')) {
            setNewPasswordError(message);
          } else if (message.includes('인증번호')) {
            setCodeError(message);
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
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (codeError) setCodeError('');
                  }}
                  className={emailError ? `${styles.input} ${styles.error}` : styles.input}
                  disabled={isSending || isVerifying || codeSent}
                  placeholder="example@email.com"
                />
                {emailError && <p className={styles.errorMessage}>{emailError}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="code" className={styles.label}>
                  인증번호
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={e => {
                    setCode(formatCode(e.target.value));
                    if (codeError) setCodeError('');
                  }}
                  className={codeError ? `${styles.input} ${styles.error}` : styles.input}
                  disabled={!codeSent || isVerifying}
                  placeholder="8자리 인증번호"
                  maxLength={8}
                />
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
                  className={newPasswordError ? `${styles.input} ${styles.error}` : styles.input}
                  disabled={isResetting}
                  placeholder="최소 8자 이상"
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
                  className={confirmPasswordError ? `${styles.input} ${styles.error}` : styles.input}
                  disabled={isResetting}
                  placeholder="비밀번호 재입력"
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
                    resetPasswordState();
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
