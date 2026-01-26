import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { FollowsService } from './follows.service';

import type { JwtPayload } from '../auth/interfaces/jwt.interface';
import type { Request as ExpressRequest } from 'express';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(JwtGuard)
  @Post(':userId')
  followUser(@Param('userId') userId: string, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.followsService.followUser(userId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Delete(':userId')
  unfollowUser(@Param('userId') userId: string, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.followsService.unfollowUser(userId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('me/followers')
  getFollowers(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.followsService.getFollowers(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('me/followings')
  getFollowings(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.followsService.getFollowings(req.user.sub);
  }
}
