import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: '리프레시 토큰은 문자열이어야 합니다.' })
  @Length(73, 73, { message: '유효하지 않은 리프레시 토큰 형식입니다.' })
  refreshToken!: string;
}
