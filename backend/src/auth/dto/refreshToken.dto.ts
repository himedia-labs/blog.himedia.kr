import { IsString, Length } from 'class-validator';
import { TOKEN_CONFIG } from '../../constants/config/token.config';

// 토큰 갱신
export class RefreshTokenDto {
  @IsString({ message: '리프레시 토큰은 문자열이어야 합니다.' })
  @Length(TOKEN_CONFIG.REFRESH_TOKEN_LENGTH, TOKEN_CONFIG.REFRESH_TOKEN_LENGTH, {
    message: '유효하지 않은 리프레시 토큰 형식입니다.',
  })
  refreshToken!: string;
}
