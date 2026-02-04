import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * 스웨거 설정
 * @description API 문서를 생성하고 등록
 */
export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Himedia API')
    .setDescription('Himedia API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'JWT access token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
};
