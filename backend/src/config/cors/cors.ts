import { INestApplication } from '@nestjs/common';
import { CorsConfig } from './cors.types';

const DEFAULT_CORS_CONFIG: CorsConfig = {
  origin: ['http://localhost:3000'],
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

// CORS 관련 전역 설정
export const setupCors = (app: INestApplication) => {
  app.enableCors({ ...DEFAULT_CORS_CONFIG });
};
