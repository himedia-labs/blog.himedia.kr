'use client';

import styles from './privacy.module.css';

/**
 * 개인정보 동의 페이지
 * @description 개인정보 수집·이용 안내를 표시
 */
export default function PrivacyConsentPage() {
  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>개인정보 수집 및 이용동의</h1>
        <p className={styles.description}>회원가입을 위한 최소한의 개인정보를 아래와 같이 수집·이용합니다.</p>

        <div className={styles.section}>
          <h2>1. 수집 항목</h2>
          <ul>
            <li>필수: 이름, 이메일, 비밀번호, 전화번호, 역할, 과정명</li>
            <li>자동수집: 서비스 이용 과정에서 생성되는 로그, 쿠키, 접속 IP 등</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>2. 수집·이용 목적</h2>
          <ul>
            <li>회원 식별 및 가입/로그인 처리</li>
            <li>서비스 제공 및 상담/문의 대응</li>
            <li>부정 이용 방지 및 보안</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>3. 보유·이용 기간</h2>
          <p>회원 탈퇴 시까지 보관하며, 관련 법령에 따라 별도 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
        </div>

        <div className={styles.section}>
          <h2>4. 동의 거부 권리 및 불이익</h2>
          <p>동의를 거부할 권리가 있으나, 미동의 시 회원가입 및 서비스 이용이 제한됩니다.</p>
        </div>

        <div className={styles.section}>
          <h2>5. 문의</h2>
          <p>개인정보 관련 문의는 고객센터를 통해 접수해주세요.</p>
        </div>
      </div>
    </div>
  );
}
