import { Body, Controller, Get, Headers, Inject, Ip, Post, Request, Response, UseGuards } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { VerifyResetCodeDto } from './dto/verifyResetCode.dto';
import { ResetPasswordWithCodeDto } from './dto/resetPasswordWithCode.dto';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';

import { JwtGuard } from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';

import appConfig from '../common/config/app.config';

import { setCookies, clearCookies } from './utils/cookie.util';

import { User } from './entities/user.entity';
import type { JwtPayload } from './interfaces/jwt.interface';

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { PasswordRateLimitGuard } from './guards/passwordRateLimit.guard';

/**
 * 인증 컨트롤러
 * @description 로그인, 회원가입, 토큰 갱신, 비밀번호 관리 등 인증 관련 API
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * 로그인
   * @description 이메일 & 비밀번호로 로그인 후 토큰 발급
   */
  @UseGuards(LocalGuard)
  @Post('login')
  async login(
    @Body() _loginDto: LoginDto,
    @Request() req: ExpressRequest & { user: User },
    @Response() res: ExpressResponse,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const authResponse = await this.authService.login(req.user, userAgent, ipAddress);
    setCookies(res, authResponse.refreshToken, this.config);
    return res.json({ accessToken: authResponse.accessToken, user: authResponse.user });
  }

  /**
   * 회원가입
   * @description 새 사용자 등록 후 승인 대기 안내
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    await this.authService.register(registerDto);
  }

  /**
   * 토큰 갱신
   * @description Refresh Token으로 새로운 Access/Refresh Token 발급
   */
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      // 쿠키가 없으면 204 No Content 반환 (비로그인 상태)
      return res.status(204).send();
    }

    const authResponse = await this.tokenService.refreshTokens({ refreshToken }, userAgent, ipAddress);
    setCookies(res, authResponse.refreshToken, this.config);
    return res.json({ accessToken: authResponse.accessToken, user: authResponse.user });
  }

  /**
   * 로그아웃
   * @description Refresh Token 무효화 및 쿠키 삭제
   */
  @Post('logout')
  async logout(@Request() req: ExpressRequest, @Response() res: ExpressResponse) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) {
      await this.tokenService.logout({ refreshToken });
    }
    clearCookies(res, this.config);
    return res.json({ success: true });
  }

  /**
   * 내 정보 조회
   * @description 현재 로그인한 사용자 프로필 조회
   */
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.userService.getProfileById(req.user.sub);
  }

  /**
   * 비밀번호 재설정 코드 전송
   * @description 이메일로 8자리 인증번호 발송 (비인증)
   */
  @UseGuards(PasswordRateLimitGuard)
  @Post('password/send-code')
  sendPasswordResetCode(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordService.sendPasswordResetCode(forgotPasswordDto);
  }

  /**
   * 재설정 코드 검증
   * @description 인증번호 유효성 확인 (비인증)
   */
  @Post('password/verify-code')
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.passwordService.verifyResetCode(verifyResetCodeDto);
  }

  /**
   * 비밀번호 재설정 (코드 사용)
   * @description 인증번호 확인 후 새 비밀번호로 변경 (비인증)
   */
  @Post('password/reset-with-code')
  resetPasswordWithCode(@Body() resetPasswordDto: ResetPasswordWithCodeDto) {
    return this.passwordService.resetPasswordWithCode(resetPasswordDto);
  }

  /**
   * 비밀번호 변경
   * @description 현재 비밀번호 확인 후 새 비밀번호로 변경 (인증)
   */
  @UseGuards(JwtGuard)
  @Post('password/change')
  changePassword(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.passwordService.changePassword(req.user.sub, changePasswordDto, userAgent, ipAddress);
  }
}
