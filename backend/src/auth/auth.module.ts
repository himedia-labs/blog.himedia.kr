import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordResetService } from './services/password-reset.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from './entities/refreshToken.entity';
import { PasswordReset } from './entities/passwordReset.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { getRequiredEnv } from '../common/exception/config.exception';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = getRequiredEnv(configService, 'JWT_SECRET');
        const expiresIn = getRequiredEnv(
          configService,
          'ACCESS_TOKEN_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'];

        return {
          secret,
          signOptions: {
            expiresIn,
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
    PasswordResetService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
