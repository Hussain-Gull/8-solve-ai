import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const superTenant = await prisma.tenant.upsert({
    where: { name: 'Global' },
    update: {},
    create: { name: 'Global' }
  });

  const superAdminEmail = 'superadmin@example.com';
  const superAdminPassword = 'ChangeMe123!';
  // find by unique composite (tenantId,email) using findFirst workaround for seed
  const existingSuper = await prisma.user.findFirst({ where: { tenantId: superTenant.id, email: superAdminEmail } });
  if (!existingSuper) {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        passwordHash: await argon2.hash(superAdminPassword),
        role: 'SUPER_ADMIN' as any,
        tenantId: superTenant.id
      }
    });
  }

  const sampleTenant = await prisma.tenant.upsert({
    where: { name: 'Acme Inc' },
    update: {},
    create: { name: 'Acme Inc' }
  });

  const adminExisting = await prisma.user.findFirst({ where: { tenantId: sampleTenant.id, email: 'admin@acme.com' } });
  const admin = adminExisting ?? await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Acme Admin',
      passwordHash: await argon2.hash('Admin123!'),
      role: 'ADMIN' as any,
      tenantId: sampleTenant.id
    }
  });

  const managerExisting = await prisma.user.findFirst({ where: { tenantId: sampleTenant.id, email: 'manager@acme.com' } });
  if (!managerExisting) {
    await prisma.user.create({
      data: {
        email: 'manager@acme.com',
        name: 'Acme Manager',
        passwordHash: await argon2.hash('Manager123!'),
        role: 'MANAGER' as any,
        tenantId: sampleTenant.id
      }
    });
  }

  const userExisting = await prisma.user.findFirst({ where: { tenantId: sampleTenant.id, email: 'user@acme.com' } });
  if (!userExisting) {
    await prisma.user.create({
      data: {
        email: 'user@acme.com',
        name: 'Acme User',
        passwordHash: await argon2.hash('User123!'),
        role: 'USER' as any,
        tenantId: sampleTenant.id
      }
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


