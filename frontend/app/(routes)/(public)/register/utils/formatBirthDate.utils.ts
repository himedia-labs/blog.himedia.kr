import type { ChangeEvent } from 'react';

import { BIRTH_DATE_CONFIG } from '@/app/shared/constants/config/register.config';

/**
 * 회원가입 : 생년월일 포맷
 * @description 입력 숫자를 YYYY-MM-DD 형식으로 변환
 */
export const formatBirthDate = (params: {
  setBirthDate: (value: string) => void;
  birthDateError: string;
  setBirthDateError: (value: string) => void;
}) => {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^0-9]/g, '').slice(0, BIRTH_DATE_CONFIG.DIGIT_MAX_LENGTH);

    let formatted = digits;
    if (digits.length > 4 && digits.length <= 6) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }

    params.setBirthDate(formatted);
    if (params.birthDateError) params.setBirthDateError('');
  };
};
