import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Advantages (e2e)', () => {
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
    await prisma.advantage.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'advadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'advadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.advantage.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('supports full CRUD + reorder', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/admin/advantages')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Гарантия на работы', description: '12 месяцев гарантии' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/admin/advantages')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Соблюдение сроков', description: 'Фиксируем сроки в договоре' })
      .expect(201);

    const list = await request(app.getHttpServer()).get('/api/advantages').expect(200);
    expect(list.body).toHaveLength(2);

    await request(app.getHttpServer())
      .patch('/api/admin/advantages/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [second.body.id, first.body.id] })
      .expect(200);

    const reordered = await request(app.getHttpServer()).get('/api/advantages').expect(200);
    expect(reordered.body[0].id).toBe(second.body.id);

    await request(app.getHttpServer())
      .delete(`/api/admin/advantages/${first.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterDelete = await request(app.getHttpServer()).get('/api/advantages').expect(200);
    expect(afterDelete.body).toHaveLength(1);
  });
});
