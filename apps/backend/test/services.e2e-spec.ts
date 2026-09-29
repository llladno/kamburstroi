import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Services (e2e)', () => {
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
    await prisma.service.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'servicesadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'servicesadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.service.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('supports full CRUD + reorder, and public GET only needs auth for writes', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/services')
      .send({ title: 'Ремонт', description: 'Косметический и капитальный ремонт' })
      .expect(401);

    const createRes = await request(app.getHttpServer())
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ремонт', description: 'Косметический и капитальный ремонт' })
      .expect(201);

    const secondRes = await request(app.getHttpServer())
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Строительство', description: 'Строительство с нуля' })
      .expect(201);

    const listRes = await request(app.getHttpServer()).get('/api/services').expect(200);
    expect(listRes.body).toHaveLength(2);

    await request(app.getHttpServer())
      .patch(`/api/admin/services/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ремонт квартир' })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/admin/services/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [secondRes.body.id, createRes.body.id] })
      .expect(200);

    const reordered = await request(app.getHttpServer()).get('/api/services').expect(200);
    expect(reordered.body[0].id).toBe(secondRes.body.id);
    expect(reordered.body[1].title).toBe('Ремонт квартир');

    await request(app.getHttpServer())
      .delete(`/api/admin/services/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterDelete = await request(app.getHttpServer()).get('/api/services').expect(200);
    expect(afterDelete.body).toHaveLength(1);
  });
});
