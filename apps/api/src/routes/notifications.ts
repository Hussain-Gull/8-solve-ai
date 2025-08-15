import { Router } from 'express';
import { z } from 'zod';
import { authenticate, getTenantFromReq, requireRole } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const router = Router();

router.get('/', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (e) { next(e); }
});

const createSchema = z.object({ userIds: z.array(z.string()).nonempty(), title: z.string().min(1), body: z.string().optional() });

router.post('/', authenticate(), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const tenantId = getTenantFromReq(req);
    const input = createSchema.parse(req.body);
    const users = await prisma.user.findMany({ where: { id: { in: input.userIds }, tenantId }, select: { id: true } });
    const ids = users.map((u) => u.id);
    const created = await prisma.$transaction(ids.map((uid) =>
      prisma.notification.create({ data: { tenantId, userId: uid, title: input.title, body: input.body ?? null } })
    ));
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.patch('/:id/read', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif || notif.userId !== user.id) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.notification.update({ where: { id: notif.id }, data: { read: true } });
    res.json(updated);
  } catch (e) { next(e); }
});


