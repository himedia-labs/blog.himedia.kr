import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';

import { AuthController } from '@/auth/auth.controller';

import { AuthService } from '@/auth/services/auth.service';
import { UserService } from '@/auth/services/user.service';
import { TokenService } from '@/auth/services/token.service';
import { RateLimitService } from '@/auth/services/rateLimit.service';
import { PasswordChangeService } from '@/auth/services/password-change.service';
import { PasswordResetService } from '@/auth/services/password-reset.service';

import { User } from '@/auth/entities/user.entity';
import { RefreshToken } from '@/auth/entities/refreshToken.entity';
import { PasswordReset } from '@/auth/entities/passwordReset.entity';

import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@/auth/strategies/local.strategy';

import { LoginRateLimitGuard } from '@/auth/guards/loginRateLimit.guard';
import { LoginValidationGuard } from '@/auth/guards/loginValidation.guard';
import { PasswordRateLimitGuard } from '@/auth/guards/passwordRateLimit.guard';

import appConfig from '@/common/config/app.config';
import { EmailModule } from '@/email/email.module';
import { SnowflakeService } from '@/common/services/snowflake.service';

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
    PasswordChangeService,
    PasswordResetService,
    RateLimitService,
    UserService,
    SnowflakeService,
    LocalStrategy,
    JwtStrategy,
    PasswordRateLimitGuard,
    LoginRateLimitGuard,
    LoginValidationGuard,
  ],
})
export class AuthModule {}
