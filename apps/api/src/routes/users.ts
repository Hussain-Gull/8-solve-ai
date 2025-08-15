import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { authenticate, getTenantFromReq, requireRole } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const router = Router();

const baseUser = {
  email: z.string().email(),
  name: z.string().min(1).max(100).nullable().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).default('USER'),
};

const createSchema = z.object({ ...baseUser, password: z.string().min(8) });
const updateSchema = z.object({ ...baseUser }).partial();

router.get('/', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const q = (req.query.q as string | undefined)?.trim();
    const where = {
      tenantId,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, tenantId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
});

// Read-only team listing for MANAGER and ADMIN
router.get('/team', authenticate(), requireRole(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const users = await prisma.user.findMany({ where: { tenantId }, select: { id: true, email: true, name: true, role: true } });
    res.json(users);
  } catch (e) { next(e); }
});

router.post('/', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const input = createSchema.parse(req.body);
    const passwordHash = await argon2.hash(input.password);
    const user = await prisma.user.create({ data: { email: input.email, name: input.name ?? null, role: input.role as any, passwordHash, tenantId } });
    res.status(201).json({ id: user.id });
  } catch (e) { next(e); }
});

router.get('/:id', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const user = await prisma.user.findFirst({ where: { id: req.params.id, tenantId }, select: { id: true, email: true, name: true, role: true, tenantId: true, createdAt: true } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const input = updateSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target || target.tenantId !== tenantId) return res.status(404).json({ error: 'Not found' });
    const user = await prisma.user.update({ where: { id: target.id }, data: { email: input.email ?? undefined, name: input.name ?? undefined, role: (input.role as any) ?? undefined } });
    res.json({ id: user.id });
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.tenantId !== tenantId) return res.status(404).json({ error: 'Not found' });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (e) { next(e); }
});


