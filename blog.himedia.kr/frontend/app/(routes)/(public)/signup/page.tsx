'use client';

import { useState } from 'react';

import styles from './signup.module.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [course, setCourse] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [roleError, setRoleError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

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

    if (hasError) return;

    // 회원가입 처리
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
              역할 <span className={styles.required}>(필수)</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="trainee"
                  checked={role === 'trainee'}
                  onChange={e => {
                    setRole(e.target.value);
                    if (roleError) setRoleError('');
                  }}
                  className={styles.radio}
                />
                <span>훈련생</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="mentor"
                  checked={role === 'mentor'}
                  onChange={e => {
                    setRole(e.target.value);
                    if (roleError) setRoleError('');
                  }}
                  className={styles.radio}
                />
                <span>멘토</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="instructor"
                  checked={role === 'instructor'}
                  onChange={e => {
                    setRole(e.target.value);
                    if (roleError) setRoleError('');
                  }}
                  className={styles.radio}
                />
                <span>강사</span>
              </label>
            </div>
            {roleError && <p className={styles.errorMessage}>{roleError}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="course" className={styles.label}>
              과정명 및 기수
            </label>
            <select id="course" value={course} onChange={e => setCourse(e.target.value)} className={styles.select}>
              <option value="">선택해주세요</option>
              <option value="frontend-1">프론트엔드 개발자 양성과정 1기</option>
              <option value="frontend-2">프론트엔드 개발자 양성과정 2기</option>
              <option value="backend-1">백엔드 개발자 양성과정 1기</option>
              <option value="backend-2">백엔드 개발자 양성과정 2기</option>
              <option value="fullstack-1">풀스택 개발자 양성과정 1기</option>
              <option value="fullstack-2">풀스택 개발자 양성과정 2기</option>
              <option value="ai-1">AI 개발자 양성과정 1기</option>
              <option value="ai-2">AI 개발자 양성과정 2기</option>
              <option value="data-1">데이터 분석 양성과정 1기</option>
              <option value="data-2">데이터 분석 양성과정 2기</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className={styles.footer}>
            <div className={styles.links}>
              <a href="/login" className={styles.link}>
                이미 계정이 있으신가요?
              </a>
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
