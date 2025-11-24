import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

// 이메일로 받은 인증번호 검증 요청에 사용
export class VerifyResetCodeDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email!: string;

  @IsString({ message: '인증번호는 문자열이어야 합니다.' })
  @Length(8, 8, { message: '인증번호는 8자리여야 합니다.' })
  code!: string;
}
