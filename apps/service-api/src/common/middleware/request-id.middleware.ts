import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare module 'express' {
  interface Request {
    id: string;
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = req.headers['x-request-id'] as string | undefined;

  req.id = requestId || uuidv4();

  res.setHeader('x-request-id', req.id);

  next();
}
