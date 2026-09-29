import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);

    await prisma.adminUser.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'testadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('rejects wrong credentials', () => {
    return request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'testadmin', password: 'wrong' })
      .expect(401);
  });

  it('logs in with correct credentials and returns a JWT usable on a protected route', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'testadmin', password: 'secret123' })
      .expect(201);

    expect(loginRes.body.accessToken).toEqual(expect.any(String));

    // /api/admin/auth/me is a trivial protected route used only to prove the guard works
    await request(app.getHttpServer())
      .get('/api/admin/auth/me')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
  });
});
