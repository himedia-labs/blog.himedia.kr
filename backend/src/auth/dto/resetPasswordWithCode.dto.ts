import { IsEmail, IsString, Length, MaxLength, MinLength, Matches } from 'class-validator';

// 인증번호 확인 후 새 비밀번호로 재설정 요청에 사용
export class ResetPasswordWithCodeDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email!: string;

  @IsString({ message: '인증번호는 문자열이어야 합니다.' })
  @Length(8, 8, { message: '인증번호는 8자리여야 합니다.' })
  code!: string;

  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '새 비밀번호는 255자 이하여야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: '새 최소 8자의 영문, 숫자, 특수문자를 입력해주세요.',
  })
  newPassword!: string;
}
