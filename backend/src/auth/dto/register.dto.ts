import {
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Equals,
  Matches,
} from 'class-validator';

import { UserRole } from '../entities/user.entity';

// 회원가입
export class RegisterDto {
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '이름은 100자 이하여야 합니다.' })
  name!: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email!: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호는 255자 이하여야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: '최소 8자의 영문, 숫자, 특수문자를 입력해주세요.',
  })
  password!: string;

  @IsString({ message: '전화번호는 문자열이어야 합니다.' })
  @MaxLength(20, { message: '전화번호는 20자 이하여야 합니다.' })
  phone!: string;

  @IsEnum(UserRole, { message: '유효한 역할을 선택해주세요.' })
  role!: UserRole;

  @IsOptional()
  @IsString({ message: '과정명은 문자열이어야 합니다.' })
  @MaxLength(255, { message: '과정명은 255자 이하여야 합니다.' })
  course?: string | null;

  @IsBoolean({ message: '개인정보 동의는 불리언 값이어야 합니다.' })
  @Equals(true, { message: '개인정보 수집 및 이용에 동의가 필요합니다.' })
  privacyConsent!: boolean;
}
