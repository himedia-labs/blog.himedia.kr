import { Controller, Delete, Param, Post, Request, UseGuards } from '@nestjs/common';

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
}
