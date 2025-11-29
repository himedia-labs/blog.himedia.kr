import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

// 로그인 후 비밀번호 변경
export class ChangePasswordDto {
  @IsString({ message: '현재 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '현재 비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '현재 비밀번호는 255자 이하여야 합니다.' })
  currentPassword!: string;

  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(255, { message: '새 비밀번호는 255자 이하여야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: '새 최소 8자의 영문, 숫자, 특수문자를 입력해주세요.',
  })
  newPassword!: string;
}
