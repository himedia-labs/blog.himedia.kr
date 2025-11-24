import { IsEmail, MaxLength } from 'class-validator';

// 비밀번호 찾기 시 이메일로 인증번호 발송 요청에 사용
export class ForgotPasswordDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email!: string;
}
