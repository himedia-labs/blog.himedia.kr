'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  useSendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
} from '@/app/api/auth/auth.mutations';
import { handleAuthError } from '@/app/api/auth/auth.error';
import { useToast } from '@/app/shared/components/toast/ToastProvider';
import styles from './forgot-password.module.css';
import Link from 'next/link';

type Step = 'verify' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const sendCodeMutation = useSendResetCodeMutation();
  const verifyCodeMutation = useVerifyResetCodeMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('verify');
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleVerifyFlow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }

    setEmailError('');
    setCodeError('');

    if (!codeSent) {
      sendCodeMutation.mutate(
        { email },
        {
          onSuccess: data => {
            showToast({ message: data.message, type: 'success' });
            setCodeSent(true);
          },
          onError: (error: Error) => {
            const message = handleAuthError(error, '인증번호 발송에 실패했습니다.');
            showToast({ message, type: 'error' });
          },
        }
      );
      return;
    }

    if (!code) {
      setCodeError('인증번호를 입력해주세요.');
      return;
    }

    if (code.length !== 8) {
      setCodeError('인증번호는 8자리입니다.');
      return;
    }

    setCodeError('');

    verifyCodeMutation.mutate(
      { email, code },
      {
        onSuccess: data => {
          showToast({ message: data.message, type: 'success' });
          setStep('password');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '인증번호 확인에 실패했습니다.');
          showToast({ message, type: 'warning' });
        },
      }
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setNewPasswordError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      setNewPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setNewPasswordError('');
    setConfirmPasswordError('');

    resetPasswordMutation.mutate(
      { email, code, newPassword },
      {
        onSuccess: data => {
          showToast({ message: data.message, type: 'success' });
          router.push('/login');
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '비밀번호 재설정에 실패했습니다.');
          showToast({ message, type: 'warning' });
        },
      }
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>비밀번호 찾기</h1>

        {step === 'verify' && (
          <form onSubmit={handleVerifyFlow} className={styles.form}>
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
                disabled={sendCodeMutation.isPending || verifyCodeMutation.isPending || codeSent}
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
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                  if (value.length <= 8) {
                    setCode(value);
                  }
                  if (codeError) setCodeError('');
                }}
                className={codeError ? `${styles.input} ${styles.error}` : styles.input}
                disabled={!codeSent || verifyCodeMutation.isPending}
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
              <button
                type="submit"
                className={styles.submitButton}
                disabled={sendCodeMutation.isPending || verifyCodeMutation.isPending}
              >
                {!codeSent
                  ? sendCodeMutation.isPending
                    ? '발송 중...'
                    : '인증번호 발송'
                  : verifyCodeMutation.isPending
                  ? '확인 중...'
                  : '인증번호 확인'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: 새 비밀번호 입력 */}
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
                  setNewPassword(e.target.value);
                  if (newPasswordError) setNewPasswordError('');
                }}
                className={newPasswordError ? `${styles.input} ${styles.error}` : styles.input}
                disabled={resetPasswordMutation.isPending}
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
                disabled={resetPasswordMutation.isPending}
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
                  setNewPassword('');
                  setConfirmPassword('');
                  setNewPasswordError('');
                  setConfirmPasswordError('');
                }}
              >
                이전으로
              </button>
              <button type="submit" className={styles.submitButton} disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
