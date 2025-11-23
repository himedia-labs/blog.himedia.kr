import type { Request } from 'express';

export type JwtFromRequestFunction = (req: Request) => string | null;

export type PassportJwtStrategy = new (...args: any[]) => {
  name: string;
  authenticate: (...args: any[]) => void;
};
