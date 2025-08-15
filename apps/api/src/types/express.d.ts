import type { Role } from '@ai-saas-admin/types/src';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; tenantId: string; role: Role };
    }
  }
}

export {};


