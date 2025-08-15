import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/errors';
import { authenticate, clearRefreshCookie, requireRole, setRefreshCookie, signAccessToken, signAndStoreRefreshToken, rotateRefreshToken } from '../lib/auth';

export const router = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8), totp: z.string().optional() });

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { email } , include: { tenant: true }});
    if (!user) throw new HttpError(401, 'Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new HttpError(401, 'Invalid credentials');
    if (user.twoFactorEnabled) {
      const code = (req.body as any).totp as string | undefined;
      if (!code || !user.twoFactorSecret || !speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code })) {
        throw new HttpError(401, 'TOTP required');
      }
    }
    const accessToken = signAccessToken({ id: user.id, tenantId: user.tenantId, role: user.role as any });
    const refreshToken = await signAndStoreRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const name = process.env.REFRESH_COOKIE_NAME || 'ai_saas_refresh';
    const token = req.cookies?.[name];
    if (!token) throw new HttpError(401, 'Missing refresh token');
    const { userId, newToken } = await rotateRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(401, 'Invalid refresh token');
    const accessToken = signAccessToken({ id: user.id, tenantId: user.tenantId, role: user.role as any });
    setRefreshCookie(res, newToken);
    res.json({ accessToken });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authenticate(), async (req, res, next) => {
  try {
    const name = process.env.REFRESH_COOKIE_NAME || 'ai_saas_refresh';
    const token = req.cookies?.[name];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as { uid: string };
        const tokens = await prisma.refreshToken.findMany({ where: { userId: decoded.uid, revoked: false } });
        for (const t of tokens) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true, revokedAt: new Date() } });
        }
      } catch {}
    }
    clearRefreshCookie(res);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Request password reset
const resetReqSchema = z.object({ email: z.string().email() });
router.post('/request-password-reset', async (req, res, next) => {
  try {
    const { email } = resetReqSchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.json({ ok: true });
    const { randomBytes } = await import('crypto');
    const selector = randomBytes(8).toString('hex');
    const verifier = randomBytes(32).toString('hex');
    const verifierHash = await argon2.hash(verifier);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await prisma.passwordReset.create({ data: { userId: user.id, selector, verifierHash, expiresAt } });
    const token = `${selector}.${verifier}`; // In prod, email this link
    res.json({ ok: true, token });
  } catch (e) { next(e); }
});

// Reset password
const resetSchema = z.object({ token: z.string(), newPassword: z.string().min(8) });
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = resetSchema.parse(req.body);
    const [selector, verifier] = token.split('.');
    if (!selector || !verifier) throw new HttpError(400, 'Invalid token');
    const pr = await prisma.passwordReset.findUnique({ where: { selector } });
    if (!pr || pr.used || pr.expiresAt < new Date()) throw new HttpError(400, 'Invalid token');
    const ok = await argon2.verify(pr.verifierHash, verifier);
    if (!ok) throw new HttpError(400, 'Invalid token');
    const passwordHash = await argon2.hash(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: pr.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: pr.id }, data: { used: true, usedAt: new Date() } })
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 2FA setup
router.post('/2fa/setup', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    const secret = speakeasy.generateSecret({ name: 'AI SaaS Admin' });
    // store temp secret on user for enable validation or return it and expect code for enable
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret.base32 } });
    res.json({ otpauthUrl: secret.otpauth_url, base32: secret.base32 });
  } catch (e) { next(e); }
});

router.post('/2fa/enable', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    const code = z.object({ totp: z.string() }).parse(req.body).totp;
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u?.twoFactorSecret) throw new HttpError(400, 'Setup required');
    const ok = speakeasy.totp.verify({ secret: u.twoFactorSecret, encoding: 'base32', token: code });
    if (!ok) throw new HttpError(400, 'Invalid code');
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/2fa/disable', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});


