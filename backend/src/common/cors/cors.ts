import { INestApplication } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';

import { CorsConfig } from './cors.types';
import appConfig from '../config/app.config';

/**
 * CORS 설정 생성
 * @description Type-safe하게 환경변수에서 허용 오리진을 가져와 CORS 설정 생성
 */
const getCorsConfig = (config: ConfigType<typeof appConfig>): CorsConfig => {
  return {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    maxAge: 3600,
  };
};

/**
 * CORS 전역 설정
 * @description 크로스 오리진 요청 허용 설정
 */
export const setupCors = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const config: ConfigType<typeof appConfig> = configService.get('app')!;
  app.enableCors(getCorsConfig(config));
};
