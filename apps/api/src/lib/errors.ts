import { ZodError } from 'zod';
import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
}


