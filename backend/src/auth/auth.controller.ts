import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Ip,
  Param,
  Patch,
  Post,
  Request,
  Response,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { UpdateProfileDto } from '@/auth/dto/updateProfile.dto';
import { ChangePasswordDto } from '@/auth/dto/changePassword.dto';
import { ForgotPasswordDto } from '@/auth/dto/forgotPassword.dto';
import { VerifyResetCodeDto } from '@/auth/dto/verifyResetCode.dto';
import { UpdateProfileBioDto } from '@/auth/dto/updateProfileBio.dto';
import { UpdateProfileImageDto } from '@/auth/dto/updateProfileImage.dto';
import { ResetPasswordWithCodeDto } from '@/auth/dto/resetPasswordWithCode.dto';

import { AuthService } from '@/auth/services/auth.service';
import { UserService } from '@/auth/services/user.service';
import { TokenService } from '@/auth/services/token.service';
import { PasswordChangeService } from '@/auth/services/password-change.service';
import { PasswordResetService } from '@/auth/services/password-reset.service';

import { JwtGuard } from '@/auth/guards/jwt.guard';
import { LocalGuard } from '@/auth/guards/local.guard';
import { LoginRateLimitGuard } from '@/auth/guards/loginRateLimit.guard';
import { LoginValidationGuard } from '@/auth/guards/loginValidation.guard';
import { PasswordRateLimitGuard } from '@/auth/guards/passwordRateLimit.guard';

import appConfig from '@/common/config/app.config';
import { TOKEN_CONFIG } from '@/constants/config/token.config';

import { setCookies, clearCookies } from '@/auth/utils/cookie.util';

import { User } from '@/auth/entities/user.entity';

import type { ConfigType } from '@nestjs/config';
import type { JwtPayload } from '@/auth/interfaces/jwt.interface';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

/**
 * 인증 컨트롤러
 * @description 로그인, 회원가입, 토큰 갱신, 비밀번호 관리 등 인증 관련 API
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly passwordResetService: PasswordResetService,
    private readonly passwordChangeService: PasswordChangeService,
    private readonly userService: UserService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * 로그인
   * @description 이메일 & 비밀번호로 로그인 후 토큰 발급
   */
  @UseGuards(LoginValidationGuard, LoginRateLimitGuard, LocalGuard)
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
    return res.status(200).json({ accessToken: authResponse.accessToken, user: authResponse.user });
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
    const refreshToken = req.cookies?.[TOKEN_CONFIG.REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) {
      // 쿠키가 없으면 204 No Content 반환 (비로그인 상태)
      return res.status(204).send();
    }

    try {
      const authResponse = await this.tokenService.refreshTokens({ refreshToken }, userAgent, ipAddress);
      setCookies(res, authResponse.refreshToken, this.config);
      return res.status(200).json({ accessToken: authResponse.accessToken, user: authResponse.user });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        clearCookies(res, this.config);
        return res.status(204).send();
      }
      throw error;
    }
  }

  /**
   * 로그아웃
   * @description Refresh Token 무효화 및 쿠키 삭제
   */
  @Post('logout')
  async logout(@Request() req: ExpressRequest, @Response() res: ExpressResponse) {
    const refreshToken = req.cookies?.[TOKEN_CONFIG.REFRESH_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await this.tokenService.logout({ refreshToken });
    }
    clearCookies(res, this.config);
    return res.status(200).json({ success: true });
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
   * 내 정보 수정
   * @description 자기소개 수정
   */
  @UseGuards(JwtGuard)
  @Patch('me/profile-bio')
  updateProfileBio(@Body() body: UpdateProfileBioDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.userService.updateProfileBio(req.user.sub, body.profileBio);
  }

  /**
   * 내 정보 수정
   * @description 프로필 이미지 수정
   */
  @UseGuards(JwtGuard)
  @Patch('me/profile-image')
  updateProfileImage(@Body() body: UpdateProfileImageDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.userService.updateProfileImage(req.user.sub, body.profileImageUrl);
  }

  /**
   * 내 정보 수정
   * @description 이름/프로필 아이디 수정
   */
  @UseGuards(JwtGuard)
  @Patch('me/profile')
  updateProfile(@Body() body: UpdateProfileDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.userService.updateProfile(req.user.sub, body.name, body.profileHandle);
  }

  /**
   * 공개 프로필 조회
   * @description 프로필 핸들로 공개 프로필 정보 반환
   */
  @Get('profile/:handle')
  getPublicProfile(@Param('handle') handle: string) {
    const normalizedHandle = (handle.startsWith('@') ? handle.slice(1) : handle).toLowerCase();
    return this.userService.getPublicProfileByHandle(normalizedHandle);
  }

  /**
   * 비밀번호 재설정 코드 전송
   * @description 이메일로 8자리 인증번호 발송 (비인증)
   */
  @UseGuards(PasswordRateLimitGuard)
  @Post('password/send-code')
  @HttpCode(200)
  sendPasswordResetCode(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordResetService.sendPasswordResetCode(forgotPasswordDto);
  }

  /**
   * 재설정 코드 검증
   * @description 인증번호 유효성 확인 (비인증)
   */
  @Post('password/verify-code')
  @HttpCode(200)
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(verifyResetCodeDto);
  }

  /**
   * 비밀번호 재설정 (코드 사용)
   * @description 인증번호 확인 후 새 비밀번호로 변경 (비인증)
   */
  @Post('password/reset-with-code')
  @HttpCode(200)
  resetPasswordWithCode(@Body() resetPasswordDto: ResetPasswordWithCodeDto) {
    return this.passwordResetService.resetPasswordWithCode(resetPasswordDto);
  }

  /**
   * 비밀번호 변경
   * @description 현재 비밀번호 확인 후 새 비밀번호로 변경 (인증)
   */
  @UseGuards(JwtGuard)
  @Post('password/change')
  @HttpCode(200)
  async changePassword(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Response() res: ExpressResponse,
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const authResponse = await this.passwordChangeService.changePassword(
      req.user.sub,
      changePasswordDto,
      userAgent,
      ipAddress,
    );
    setCookies(res, authResponse.refreshToken, this.config);
    return res.status(200).json({ accessToken: authResponse.accessToken, user: authResponse.user });
  }
}
