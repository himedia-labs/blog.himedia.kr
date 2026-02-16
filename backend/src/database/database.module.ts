import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
          synchronize: !isProduction,
          // Vercel Serverless 환경: 최소 커넥션으로 설정
          extra: {
            max: isProduction ? 2 : 10,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
