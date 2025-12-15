import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';

import { AuthController } from './auth.controller';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { RateLimitService } from './services/rateLimit.service';

import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refreshToken.entity';
import { PasswordReset } from './entities/passwordReset.entity';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

import { EmailModule } from '../email/email.module';
import appConfig from '../common/config/app.config';
import { SnowflakeService } from '../common/services/snowflake.service';
import { PasswordRateLimitGuard } from './guards/passwordRateLimit.guard';

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
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    RateLimitService,
    UserService,
    SnowflakeService,
    LocalStrategy,
    JwtStrategy,
    PasswordRateLimitGuard,
  ],
})
export class AuthModule {}
