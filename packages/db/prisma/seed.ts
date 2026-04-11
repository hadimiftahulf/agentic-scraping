import { PrismaClient, UserStatus } from '@prisma/client';
import { hash } from 'bcrypt'; // we'll install bcrypt if needed, or we can use a stub hash for now

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeder...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
    },
  });

  const publicRole = await prisma.role.upsert({
    where: { name: 'PUBLIC' },
    update: {},
    create: {
      name: 'PUBLIC',
      description: 'Standard public user',
    },
  });

  // 2. Create Permissions
  const allPermissions = ['USER:CREATE', 'USER:UPDATE', 'USER:DELETE', 'USER:READ'];
  for (const code of allPermissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: `Permission to ${code}`,
        roles: {
          connect: [{ id: adminRole.id }],
        },
      },
    });
  }

  // 3. Create Admin User
  const defaultPasswordHash = await hash('Admin123!', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@agentic.bot' },
    update: {},
    create: {
      email: 'admin@agentic.bot',
      fullName: 'System Administrator',
      passwordHash: defaultPasswordHash,
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
    },
  });

  console.log('Seeder finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
