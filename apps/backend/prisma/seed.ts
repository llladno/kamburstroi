import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) {
    throw new Error('ADMIN_LOGIN and ADMIN_PASSWORD must be set to seed the admin user');
  }

  const existing = await prisma.adminUser.findUnique({ where: { login } });
  if (existing) {
    console.log(`Admin "${login}" already exists, skipping.`);
    return;
  }

  await prisma.adminUser.create({
    data: { login, passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Admin "${login}" created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
