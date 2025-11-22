import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { JwtPayload } from '../interfaces/jwt.interface';

import type { Request } from 'express';
import * as passportJwt from 'passport-jwt';

type JwtFromRequestFunction = (req: Request) => string | null;
type PassportJwtStrategy = new (...args: any[]) => {
  name: string;
  authenticate: (...args: any[]) => void;
};

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
