import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { prisma } from './prisma';
import type { Role } from '@ai-saas-admin/types/src';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errors';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 7; // for cookie expiry

type JwtUser = { id: string; tenantId: string; role: Role };

export function signAccessToken(payload: JwtUser) {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TTL });
}

export async function signAndStoreRefreshToken(userId: string) {
  const secret = process.env.REFRESH_TOKEN_SECRET as string;
  const token = jwt.sign({ uid: userId }, secret, { expiresIn: `${REFRESH_TTL_DAYS}d` });
  const tokenHash = await argon2.hash(token);
  await prisma.refreshToken.create({ data: { userId, tokenHash } });
  return token;
}

export async function rotateRefreshToken(oldToken: string) {
  const secret = process.env.REFRESH_TOKEN_SECRET as string;
  try {
    const decoded = jwt.verify(oldToken, secret) as { uid: string; iat: number; exp: number };
    const userId = decoded.uid;
    const tokens = await prisma.refreshToken.findMany({ where: { userId, revoked: false } });
    const match = await Promise.all(
      tokens.map(async (t) => ({ t, ok: await argon2.verify(t.tokenHash, oldToken) }))
    );
    const found = match.find((m) => m.ok)?.t;
    if (!found) throw new Error('No active token');
    await prisma.refreshToken.update({ where: { id: found.id }, data: { revoked: true, revokedAt: new Date() } });
    const newToken = await signAndStoreRefreshToken(userId);
    return { userId, newToken };
  } catch {
    throw new HttpError(401, 'Invalid refresh token');
  }
}

export function setRefreshCookie(res: Response, token: string) {
  const name = process.env.REFRESH_COOKIE_NAME || 'ai_saas_refresh';
  const maxAge = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/auth'
  });
}

export function clearRefreshCookie(res: Response) {
  const name = process.env.REFRESH_COOKIE_NAME || 'ai_saas_refresh';
  res.clearCookie(name, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/auth' });
}

export function authenticate() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) throw new HttpError(401, 'Missing token');
      const token = auth.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUser;
      (req as any).user = payload;
      next();
    } catch {
      next(new HttpError(401, 'Unauthorized'));
    }
  };
}

export function requireRole(roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return next(new HttpError(401, 'Unauthorized'));
    if (!roles.includes(user.role)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}

export function getTenantFromReq(req: Request) {
  const user = (req as any).user as JwtUser | undefined;
  if (!user) throw new HttpError(401, 'Unauthorized');
  return user.tenantId;
}


