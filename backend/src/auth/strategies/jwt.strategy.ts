import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserService } from '../services/user.service';
import { AUTH_ERROR_MESSAGES } from '../auth.constants';

import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt.interface';

/**
 * 쿠키 추출
 * @description 요청 쿠키에서 accessToken 추출
 */
const cookieExtractor = (req: Request): string | null => {
  const token = req?.cookies?.accessToken as unknown;
  return typeof token === 'string' ? token : null;
};

/**
 * JWT 인증
 * @description 쿠키 우선, 없으면 Authorization 헤더에서 토큰 추출
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      // 토큰 추출 > 쿠키 우선, 없으면 Bearer 토큰 사용
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      // 만료된 토큰 거부
      ignoreExpiration: false,
      // JWT 시크릿 키
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * JWT 페이로드 검증
   * @description 사용자 존재 여부 및 승인 상태 확인
   */
  async validate(payload: JwtPayload) {
    // 사용자 조회
    const user = await this.userService.getUserByIdOrThrow(payload.sub);

    // 승인되지 않은 사용자
    if (!user.approved) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.PENDING_APPROVAL);
    }

    // 최신 권한 정보 반환
    return {
      sub: user.id,
      role: user.role,
    };
  }
}
