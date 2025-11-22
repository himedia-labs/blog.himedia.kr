import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService } from '../auth.service';

import * as passportLocal from 'passport-local';

type VerifyFunction = (
  username: string,
  password: string,
  done: (error: Error | null, user?: any, info?: any) => void,
) => void;

type LocalStrategyConstructor = new (
  options: {
    usernameField?: string;
    passwordField?: string;
    session?: boolean;
  },
  verify: VerifyFunction,
) => {
  name: string;
  authenticate: (...args: any[]) => void;
};

const { Strategy: LocalStrategyBase } = passportLocal as {
  Strategy: LocalStrategyConstructor;
};

@Injectable()
export class LocalStrategy extends PassportStrategy(LocalStrategyBase) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    return this.authService.validateUser(email, password);
  }
}
