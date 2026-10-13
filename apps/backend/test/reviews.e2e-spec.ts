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

describe('Reviews (e2e)', () => {
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
    await prisma.review.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'reviewsadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'reviewsadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('accepts a public submission as pending, hidden from the public list until approved', async () => {
    const submitRes = await request(app.getHttpServer())
      .post('/api/reviews')
      .send({ name: 'Александр', rating: 5, text: 'Работы выполнены качественно и в срок' })
      .expect(201);

    expect(submitRes.body.status).toBe('pending');

    const publicList = await request(app.getHttpServer()).get('/api/reviews').expect(200);
    expect(publicList.body).toHaveLength(0);

    await request(app.getHttpServer())
      .patch(`/api/admin/reviews/${submitRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' })
      .expect(200);

    const afterApproval = await request(app.getHttpServer()).get('/api/reviews').expect(200);
    expect(afterApproval.body).toHaveLength(1);
    expect(afterApproval.body[0].name).toBe('Александр');
  });

  it('accepts an anonymous photo upload and returns a usable URL for the review submission', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post('/api/reviews/photo')
      .attach('file', ONE_BY_ONE_PNG, 'tiny.png')
      .expect(201);

    expect(uploadRes.body.url).toMatch(/^https?:\/\//);

    const submitRes = await request(app.getHttpServer())
      .post('/api/reviews')
      .send({
        name: 'Светлана',
        rating: 5,
        text: 'Прикладываю фото результата',
        photoUrl: uploadRes.body.url,
      })
      .expect(201);

    expect(submitRes.body.photoUrl).toBe(uploadRes.body.url);
  });

  it('rejects a photo upload with no file attached', () => {
    return request(app.getHttpServer()).post('/api/reviews/photo').expect(400);
  });

  it('rejects invalid ratings', () => {
    return request(app.getHttpServer())
      .post('/api/reviews')
      .send({ name: 'Тест', rating: 7, text: 'Слишком высокая оценка' })
      .expect(400);
  });

  it('admin can list all statuses and delete', async () => {
    const submitRes = await request(app.getHttpServer())
      .post('/api/reviews')
      .send({ name: 'Мария', rating: 4, text: 'Хорошая работа, но есть замечания' })
      .expect(201);

    const adminList = await request(app.getHttpServer())
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(adminList.body.some((r: { id: string }) => r.id === submitRes.body.id)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/api/admin/reviews/${submitRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
