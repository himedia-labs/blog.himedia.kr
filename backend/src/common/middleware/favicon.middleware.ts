import type { Request, Response, NextFunction } from 'express';

/**
 * Favicon 미들웨어
 * @description favicon 요청을 204로 처리해 404 에러 방지
 */
export const faviconMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.url.includes('favicon')) {
    return res.status(204).end();
  }
  next();
};
