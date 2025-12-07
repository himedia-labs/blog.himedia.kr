import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-local';

import { AuthService } from '../services/auth.service';

import type { User } from '../entities/user.entity';

/**
 * 로컬 인증
 * @description 이메일/비밀번호 기반 로그인
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * 사용자 검증
   * @description 이메일과 비밀번호로 사용자 인증
   */
  async validate(email: string, password: string): Promise<User> {
    return this.authService.validateUser(email, password);
  }
}
