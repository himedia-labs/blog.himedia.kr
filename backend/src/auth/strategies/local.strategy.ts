import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService } from '../auth.service';

import * as passportLocal from 'passport-local';
import type { LocalStrategyConstructor } from '../interfaces/local.strategy.interface';

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
