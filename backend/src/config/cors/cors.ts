import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorsConfig } from './cors.types';
import { getRequiredEnv } from '../../common/exception/config.exception';

const getCorsConfig = (configService: ConfigService): CorsConfig => {
  const origins = getRequiredEnv(configService, 'CORS_ORIGINS');
  const originList = origins.split(',');

  return {
    origin: originList,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    exposedHeaders: ['Custom-Header'],
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};

// CORS 관련 전역 설정
export const setupCors = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  app.enableCors(getCorsConfig(configService));
};
