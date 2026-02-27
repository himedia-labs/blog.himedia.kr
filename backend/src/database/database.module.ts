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
          host: configService.get<string>('HM_DB_HOST'),
          port: configService.get<number>('HM_DB_PORT'),
          username: configService.get<string>('HM_DB_USER'),
          password: configService.get<string>('HM_DB_PASSWORD'),
          database: configService.get<string>('HM_DB_NAME'),
          entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
          synchronize: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
