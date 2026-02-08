'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FaCheck } from 'react-icons/fa';
import { RxInfoCircled } from 'react-icons/rx';
import { IoIosArrowDown } from 'react-icons/io';
import { TbExternalLink } from 'react-icons/tb';

import {
  useRegisterMutation,
  useSendEmailVerificationCodeMutation,
  useVerifyEmailVerificationCodeMutation,
} from '@/app/api/auth/auth.mutations';

import { isValidPassword } from '@/app/shared/utils/password';
import { useToast } from '@/app/shared/components/toast/toast';
import { EMAIL_REGEX } from '@/app/shared/constants/config/auth.config';
import { EMAIL_MESSAGES } from '@/app/shared/constants/messages/auth.message';
import {
  BIRTH_DATE_CONFIG,
  COURSE_OPTIONS,
  EMAIL_VERIFICATION_CODE_LENGTH,
  PHONE_CONFIG,
} from '@/app/shared/constants/config/register.config';

import { useEmailVerificationAutoVerify, useRegisterForm } from '@/app/(routes)/(public)/register/hooks';
import { createNextStepHandler, registerSubmit, sendEmailCode, verifyEmailCode } from '@/app/(routes)/(public)/register/handlers';

import styles from '@/app/(routes)/(public)/register/register.module.css';

/**
 * 회원가입 페이지
 * @description 회원가입 입력과 제출을 처리
 */
export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const sendCodeMutation = useSendEmailVerificationCodeMutation();
  const { showToast } = useToast();
  const verifyCodeMutation = useVerifyEmailVerificationCodeMutation();
  const restoredToastShownRef = useRef(false);

  // 폼 상태/핸들러(캐시 로드 및 저장, 전화번호 포맷 등 포함)
  const {
    form,
    setFormField,
    errors,
    setErrors,
    handlers: { handleBirthDateChange, handlePhoneChange, clearFormCache, markKeepCache },
    hasCache,
    restoredFromKeep,
  } = useRegisterForm();

  // 폼 입력값 상태
  const { name, email, birthDate, password, passwordConfirm, phone, role, course, privacyConsent } = form;
  // 폼 에러 상태
  const {
    nameError,
    emailError,
    passwordError,
    passwordConfirmError,
    phoneError,
    birthDateError,
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
    setBirthDateError,
    setRoleError,
    setCourseError,
    setPrivacyError,
  } = setErrors;

  // 스텝 상태
  const [step, setStep] = useState<1 | 2>(1);
  // 이메일 인증 상태
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeError, setEmailCodeError] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);

  // 약관 페이지에서 돌아왔을 때 캐시 로드 안내 토스트
  useEffect(() => {
    if (hasCache && restoredFromKeep && !restoredToastShownRef.current) {
      showToast({ message: '임시 저장된 내용을 불러왔습니다.', type: 'info' });
      restoredToastShownRef.current = true;
    }
  }, [hasCache, restoredFromKeep, showToast]);

  // 회원가입 핸들러
  const handleSubmit = registerSubmit({
    name,
    email,
    password,
    passwordConfirm,
    phone,
    birthDate,
    role,
    course,
    privacyConsent,
    setNameError,
    setEmailError,
    setPasswordError,
    setPasswordConfirmError,
    setPhoneError,
    setBirthDateError,
    setRoleError,
    setCourseError,
    setPrivacyError,
    registerMutation,
    showToast,
    router,
    onSuccessCleanup: clearFormCache,
  });

  const handleNextStep = createNextStepHandler({
    name,
    email,
    birthDate,
    password,
    passwordConfirm,
    phone,
    isEmailVerified,
    setNameError,
    setEmailError,
    setBirthDateError,
    setPasswordError,
    setPasswordConfirmError,
    setPhoneError,
    showToast,
    setStep,
  });

  const handleSendEmailCode = sendEmailCode({
    email,
    setEmailError,
    setCodeError: setEmailCodeError,
    setEmailCode,
    setIsEmailCodeSent,
    sendCodeMutation,
    showToast,
  });

  const handleVerifyEmailCode = verifyEmailCode({
    code: emailCode,
    email,
    setEmailError,
    setCodeError: setEmailCodeError,
    setIsEmailVerified,
    showToast,
    verifyCodeMutation,
  });

  useEmailVerificationAutoVerify({
    emailCode,
    codeLength: EMAIL_VERIFICATION_CODE_LENGTH,
    isEmailCodeSent,
    isEmailVerified,
    isVerifying: verifyCodeMutation.isPending,
    onVerify: handleVerifyEmailCode,
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
            {step === 1 ? (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    <span className={styles.labelText}>이름</span>
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
                    <span className={styles.labelText}>이메일 주소</span>
                    <span
                      className={isEmailVerified ? `${styles.labelHint} ${styles.labelHintVerified}` : styles.labelHint}
                    >
                      ({isEmailVerified ? '인증 완료' : '미인증'})
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => {
                      const next = e.target.value;
                      setFormField('email', next);
                      if (isEmailVerified || isEmailCodeSent || emailCode) {
                        setIsEmailVerified(false);
                        setIsEmailCodeSent(false);
                        setEmailCode('');
                        setEmailCodeError('');
                      }
                      if (!EMAIL_REGEX.test(next)) {
                        setEmailError(EMAIL_MESSAGES.invalid);
                      } else if (emailError) {
                        setEmailError('');
                      }
                    }}
                    className={emailError ? `${styles.input} ${styles.error}` : styles.input}
                    autoComplete="username"
                    disabled={isEmailVerified}
                  />
                  {emailError && <p className={styles.errorMessage}>{emailError}</p>}
                </div>

                {isEmailCodeSent && (
                  <div className={styles.formGroup}>
                    <label htmlFor="emailCode" className={styles.label}>
                      <span className={styles.labelText}>인증번호</span>
                    </label>
                    <input
                      type="text"
                      id="emailCode"
                      value={emailCode}
                      onChange={e => {
                        setEmailCode(e.target.value);
                        if (emailCodeError) setEmailCodeError('');
                      }}
                      className={emailCodeError ? `${styles.input} ${styles.error}` : styles.input}
                      placeholder="8자리 인증번호"
                      maxLength={EMAIL_VERIFICATION_CODE_LENGTH}
                      autoComplete="one-time-code"
                      disabled={isEmailVerified}
                    />
                    {emailCodeError && <p className={styles.errorMessage}>{emailCodeError}</p>}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="birthDate" className={styles.label}>
                    <span className={styles.labelText}>생년월일</span>
                  </label>
                  <input
                    type="text"
                    id="birthDate"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    className={birthDateError ? `${styles.input} ${styles.error}` : styles.input}
                    placeholder="YYYY-MM-DD"
                    inputMode="numeric"
                    maxLength={BIRTH_DATE_CONFIG.FORMATTED_MAX_LENGTH}
                    autoComplete="bday"
                  />
                  {birthDateError && <p className={styles.errorMessage}>{birthDateError}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    <span className={styles.labelText}>비밀번호</span>
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
                    className={
                      passwordError
                        ? `${styles.input} ${styles.passwordInput} ${styles.error}`
                        : `${styles.input} ${styles.passwordInput}`
                    }
                    autoComplete="new-password"
                  />
                  {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="passwordConfirm" className={styles.label}>
                    <span className={styles.labelText}>비밀번호 확인</span>
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
                    className={
                      passwordConfirmError
                        ? `${styles.input} ${styles.passwordInput} ${styles.error}`
                        : `${styles.input} ${styles.passwordInput}`
                    }
                    autoComplete="new-password"
                  />
                  {passwordConfirmError && <p className={styles.errorMessage}>{passwordConfirmError}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    <span className={styles.labelText}>전화번호</span>
                    <span
                      className={styles.infoIcon}
                      role="img"
                      aria-label="전화번호 안내"
                      data-tooltip="전화번호는 계정 보호 및 고객 지원을 위해 사용됩니다."
                    >
                      <RxInfoCircled aria-hidden="true" />
                    </span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={phoneError ? `${styles.input} ${styles.error}` : styles.input}
                    placeholder="010 1234 5678"
                    maxLength={PHONE_CONFIG.FORMATTED_MAX_LENGTH}
                    autoComplete="tel"
                  />
                  {phoneError && <p className={styles.errorMessage}>{phoneError}</p>}
                </div>

                <div className={styles.footer}>
                  <div className={styles.links}>
                    <Link href="/login" className={styles.link}>
                      이미 계정이 있으신가요?
                    </Link>
                    {isEmailCodeSent && !isEmailVerified && (
                      <>
                        <span className={styles.separator}>|</span>
                        <button
                          type="button"
                          className={`${styles.link} ${styles.linkButton}`}
                          disabled={sendCodeMutation.isPending || verifyCodeMutation.isPending}
                          onClick={() => {
                            handleSendEmailCode();
                          }}
                        >
                          재전송
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={
                      sendCodeMutation.isPending ||
                      verifyCodeMutation.isPending ||
                      (isEmailCodeSent && !isEmailVerified)
                    }
                    onClick={isEmailVerified ? handleNextStep : handleSendEmailCode}
                  >
                    {sendCodeMutation.isPending
                      ? '발송 중...'
                      : isEmailVerified || isEmailCodeSent
                        ? '다음'
                        : '인증번호 발송'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="role" className={styles.label}>
                    <span className={styles.labelText}>역할</span>
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
                      <option value="graduate">수료생</option>
                      <option value="instructor">강사</option>
                      <option value="mentor">멘토</option>
                    </select>
                    <IoIosArrowDown className={styles.selectIcon} aria-hidden />
                  </div>
                  {roleError && <p className={styles.errorMessage}>{roleError}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="course" className={styles.label}>
                    <span className={styles.labelText}>과정명 및 기수</span>
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
                            if (name || email || password || phone || role || course || passwordConfirm || birthDate) {
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
                  <div className={styles.stepActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setStep(1)}>
                      이전
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      회원가입
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
