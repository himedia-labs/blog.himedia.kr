import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import type { JwtPayload } from '../interfaces/jwt.interface';
import * as passportJwt from 'passport-jwt';
import type {
  JwtFromRequestFunction,
  PassportJwtStrategy,
} from '../interfaces/jwt.strategy.interface';

const { Strategy: JwtStrategyBase, ExtractJwt } = passportJwt as {
  Strategy: PassportJwtStrategy;
  ExtractJwt: {
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
  };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'change-me',
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
