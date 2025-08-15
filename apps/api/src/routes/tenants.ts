import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const router = Router();

const createSchema = z.object({ name: z.string().min(2).max(64) });

router.post('/', authenticate(), requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { name } = createSchema.parse(req.body);
    const tenant = await prisma.tenant.create({ data: { name } });
    res.status(201).json(tenant);
  } catch (e) { next(e); }
});

router.get('/', authenticate(), requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
    const [items, total] = await Promise.all([
      prisma.tenant.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.tenant.count()
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
});


