import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';

import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refreshToken.entity';
import { PasswordReset } from './entities/passwordReset.entity';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

import { EmailModule } from '../email/email.module';
import appConfig from '../config/app.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config: ConfigType<typeof appConfig> = configService.get('app')!;
        return {
          secret: config.jwt.secret,
          signOptions: {
            expiresIn: config.jwt.accessExpiresIn,
          },
        };
      },
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, PasswordService, UserService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
