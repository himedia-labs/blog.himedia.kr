import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { LoginDto } from './dto/login.dto';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { JwtGuard } from './guards/jwt.guard';
import type { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.guard';
import type { JwtPayload } from './interfaces/jwt.interface';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { VerifyResetCodeDto } from './dto/verifyResetCode.dto';
import { ResetPasswordWithCodeDto } from './dto/resetPasswordWithCode.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('login')
  login(
    @Body() _loginDto: LoginDto,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.authService.login(req.user);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.authService.getProfileById(req.user.sub);
  }

  @Post('password/send-code')
  sendPasswordResetCode(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordResetService.sendPasswordResetCode(forgotPasswordDto);
  }

  @Post('password/verify-code')
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(verifyResetCodeDto);
  }

  @Post('password/reset-with-code')
  resetPasswordWithCode(@Body() resetPasswordDto: ResetPasswordWithCodeDto) {
    return this.passwordResetService.resetPasswordWithCode(resetPasswordDto);
  }

  @UseGuards(JwtGuard)
  @Post('password/change')
  changePassword(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }
}
