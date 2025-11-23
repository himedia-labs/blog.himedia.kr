import { ConfigService } from '@nestjs/config';

export class ConfigValidationException extends Error {
  constructor(envKey: string) {
    super(`${envKey} 환경변수가 설정되지 않았습니다.`);
    this.name = 'ConfigValidationException';
  }
}

/**
 * 필수 환경변수를 가져옵니다. 설정되지 않은 경우 예외를 발생시킵니다.
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
