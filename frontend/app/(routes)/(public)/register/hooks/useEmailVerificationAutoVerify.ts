import { useEffect, useRef } from 'react';

/**
 * 회원가입 : 이메일 인증 자동 검증 훅
 * @description 인증번호 길이가 충족되면 자동으로 검증을 호출한다
 */
export const useEmailVerificationAutoVerify = (params: {
  codeLength: number;
  emailCode: string;
  isEmailCodeSent: boolean;
  isEmailVerified: boolean;
  isVerifying: boolean;
  onVerify: () => void;
}) => {
  // 자동 검증 중복 방지
  const lastVerifiedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!params.isEmailCodeSent || params.isEmailVerified) return;
    if (params.emailCode.length !== params.codeLength) {
      lastVerifiedCodeRef.current = null;
      return;
    }
    if (params.isVerifying) return;
    if (lastVerifiedCodeRef.current === params.emailCode) return;

    lastVerifiedCodeRef.current = params.emailCode;
    params.onVerify();
  }, [
    params.codeLength,
    params.emailCode,
    params.isEmailCodeSent,
    params.isEmailVerified,
    params.isVerifying,
    params.onVerify,
  ]);
};
