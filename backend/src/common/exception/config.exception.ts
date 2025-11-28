import { ConfigService } from '@nestjs/config';

/**
 * 환경변수 검증 예외
 * @description 필수 환경변수가 설정되지 않았을 때 발생
 */
export class ConfigValidationException extends Error {
  constructor(envKey: string) {
    super(`${envKey} 환경변수가 설정되지 않았습니다.`);
    this.name = 'ConfigValidationException';
  }
}

/**
 * 필수 환경변수 가져오기
 * @description 환경변수가 없으면 ConfigValidationException 발생
 */
export const getRequiredEnv = (
  configService: ConfigService,
  key: string,
): string => {
  const value = configService.get<string>(key);

  if (!value) {
    throw new ConfigValidationException(key);
  }

  return value;
};
