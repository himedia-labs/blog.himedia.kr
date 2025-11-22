import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.guard';
import { JwtPayload } from './interfaces/jwt.interface';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ChangePasswordDto } from './dto/resetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @UseGuards(JwtGuard)
  @Post('password/reset')
  resetPassword(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.resetPassword(req.user.sub, changePasswordDto);
  }
}
