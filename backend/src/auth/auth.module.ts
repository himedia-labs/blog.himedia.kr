import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from './entities/refreshToken.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get(
          'ACCESS_TOKEN_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'];

        if (!secret) {
          throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
        }

        if (!expiresIn) {
          throw new Error(
            'ACCESS_TOKEN_EXPIRES_IN 환경변수가 설정되지 않았습니다.',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
