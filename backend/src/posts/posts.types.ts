import type { Request as ExpressRequest } from 'express';

import type { JwtPayload } from '@/auth/interfaces/jwt.interface';

// 타입/정의
export type AuthRequest = ExpressRequest & { user: JwtPayload };

export type OptionalAuthRequest = ExpressRequest & { user?: JwtPayload };
