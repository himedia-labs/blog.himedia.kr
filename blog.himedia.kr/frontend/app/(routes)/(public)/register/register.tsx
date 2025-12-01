'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { TbExternalLink } from 'react-icons/tb';

import { useRegisterMutation } from '@/app/api/auth/auth.mutations';
import { handleAuthError } from '@/app/api/auth/auth.error';
import { useToast } from '@/app/shared/components/toast/ToastProvider';

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
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [course, setCourse] = useState('');
  const [courseError, setCourseError] = useState('');
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

    // 에러 초기화
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setPasswordConfirmError('');
    setPhoneError('');
    setRoleError('');
    setCourseError('');
    setPrivacyError(false);

    let hasError = false;

    // 필수 입력 체크만 수행
    if (!name) {
      setNameError('이름을 입력해주세요.');
      hasError = true;
    }

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      setPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
      hasError = true;
    }

    if (!passwordConfirm) {
      setPasswordConfirmError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    if (!phone) {
      setPhoneError('전화번호를 입력해주세요.');
      hasError = true;
    }

    if (!role) {
      setRoleError('역할을 선택해주세요.');
      hasError = true;
    }

    if (!course) {
      setCourseError('과정명을 선택해주세요.');
      hasError = true;
    }

    if (!privacyConsent) {
      setPrivacyError(true);
      hasError = true;
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
          showToast({
            message: '회원가입이 완료되었습니다.\n관리자 승인 후 로그인하실 수 있습니다.',
            type: 'success',
            duration: 5000,
          });
          setTimeout(() => {
            router.push('/');
          });
        },
        onError: (error: Error) => {
          const message = handleAuthError(error, '회원가입에 실패했습니다.');

          if (message.includes('이름')) {
            setNameError(message);
          } else if (message.includes('이메일')) {
            setEmailError(message);
          } else if (message.includes('비밀번호')) {
            setPasswordError(message);
          } else if (message.includes('전화번호')) {
            setPhoneError(message);
          } else if (message.includes('역할')) {
            setRoleError(message);
          } else if (message.includes('과정')) {
            setCourseError(message);
          } else {
            // 특정 필드를 알 수 없는 경우 이메일 필드에 표시
            setEmailError(message);
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
                  const value = e.target.value;
                  setPassword(value);
                  if (value && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
                    setPasswordError('최소 8자의 영문, 숫자, 특수문자를 입력해주세요.');
                  } else {
                    setPasswordError('');
                  }
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
                <select
                  id="course"
                  value={course}
                  onChange={e => {
                    setCourse(e.target.value);
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
                        setPrivacyConsent(e.target.checked);
                        if (privacyError) setPrivacyError(false);
                      }}
                      className={styles.checkbox}
                    />
                    <FaCheck className={styles.checkboxIcon} aria-hidden />
                  </label>
                  <div className={`${styles.checkboxText} ${privacyError ? styles.checkboxTextError : ''}`}>
                    <Link href="/terms/privacy" className={`${styles.link} ${styles.consentLink}`}>
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
