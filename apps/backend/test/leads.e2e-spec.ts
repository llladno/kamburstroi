import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Leads (e2e)', () => {
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
    await prisma.lead.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'leadsadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'leadsadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.lead.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('accepts a public lead submission without auth, requires name and phone', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .send({ name: 'Пётр', comment: 'Без телефона' })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/api/leads')
      .send({ name: 'Пётр', phone: '+79991234567', comment: 'Интересует ремонт кухни' })
      .expect(201);

    expect(created.body.isProcessed).toBe(false);
  });

  it('lets the admin list and mark leads as processed', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/leads')
      .send({ name: 'Ольга', phone: '+79997654321' })
      .expect(201);

    await request(app.getHttpServer()).get('/api/admin/leads').expect(401);

    const list = await request(app.getHttpServer())
      .get('/api/admin/leads')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.some((l: { id: string }) => l.id === created.body.id)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/admin/leads/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isProcessed: true })
      .expect(200);
  });
});
