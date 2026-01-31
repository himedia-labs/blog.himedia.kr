import type { ChangeEvent } from 'react';

import { PHONE_CONFIG } from '@/app/shared/constants/config/register.config';

/**
 * 회원가입 : 전화번호 포맷
 * @description 입력 숫자를 XXX XXXX XXXX 형식으로 변환
 */
export const formatPhone = (params: {
  setPhone: (value: string) => void;
  phoneError: string;
  setPhoneError: (value: string) => void;
}) => {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^0-9]/g, '').slice(0, PHONE_CONFIG.DIGIT_MAX_LENGTH);

    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }

    params.setPhone(formatted);
    if (params.phoneError) params.setPhoneError('');
  };
};
