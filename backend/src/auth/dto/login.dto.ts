import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email!: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '비밀번호는 255자 이하여야 합니다.' })
  password!: string;
}
