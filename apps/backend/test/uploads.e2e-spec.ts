import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);

    await prisma.adminUser.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'uploadadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'uploadadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('rejects unauthenticated uploads', () => {
    return request(app.getHttpServer()).post('/api/admin/uploads').expect(401);
  });

  it('accepts an authenticated image upload and returns a url', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', ONE_BY_ONE_PNG, 'tiny.png');

    expect(res.status).toBe(201);
    expect(res.body.url).toEqual(expect.stringContaining('/uploads/'));
  });
});
