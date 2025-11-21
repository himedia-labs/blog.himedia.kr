import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupCors } from './config/cors/cors';
import { setupSwagger } from './config/swagger/swagger';
import { setupFilters } from './common/exception/httpException';
import { setupValidation } from './common/validation/validation';
import { setupInterceptors } from './common/logging/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupCors(app);
  setupFilters(app);
  setupValidation(app);
  setupInterceptors(app);

  setupSwagger(app);
  await app.listen(Number(process.env.PORT));
}
void bootstrap();
