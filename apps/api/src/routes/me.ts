import { Router } from 'express';
import { authenticate } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const router = Router();

router.get('/', authenticate(), async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string };
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, name: true, role: true, tenantId: true } });
    res.json(me);
  } catch (e) { next(e); }
});


