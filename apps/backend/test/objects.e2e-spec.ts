import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Objects (e2e)', () => {
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
    await prisma.projectImage.deleteMany();
    await prisma.project.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'objectsadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'objectsadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.projectImage.deleteMany();
    await prisma.project.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('creates an object with an auto-generated unique slug, hidden until published', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/objects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Ремонт квартиры на Ленина',
        workType: 'Косметический ремонт',
        description: 'Полный цикл работ под ключ',
        year: 2026,
      })
      .expect(201);

    expect(created.body.slug).toBe('remont-kvartiry-na-lenina');
    expect(created.body.isPublished).toBe(false);

    await request(app.getHttpServer())
      .get(`/api/objects/${created.body.slug}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/admin/objects/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isPublished: true })
      .expect(200);

    const publicDetail = await request(app.getHttpServer())
      .get(`/api/objects/${created.body.slug}`)
      .expect(200);
    expect(publicDetail.body.title).toBe('Ремонт квартиры на Ленина');
  });

  it('manages a gallery: add, set cover, reorder, remove', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/objects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Дом у моря',
        workType: 'Строительство',
        description: 'Загородный дом',
        year: 2025,
        isPublished: true,
      })
      .expect(201);

    const image1 = await request(app.getHttpServer())
      .post(`/api/admin/objects/${created.body.id}/images`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://localhost:3000/uploads/a.webp', isCover: true })
      .expect(201);

    const image2 = await request(app.getHttpServer())
      .post(`/api/admin/objects/${created.body.id}/images`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://localhost:3000/uploads/b.webp' })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/objects/${created.body.slug}`)
      .expect(200);
    expect(detail.body.images).toHaveLength(2);
    expect(detail.body.images.find((i: { isCover: boolean }) => i.isCover).id).toBe(
      image1.body.id,
    );

    await request(app.getHttpServer())
      .patch(`/api/admin/objects/${created.body.id}/images/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [image2.body.id, image1.body.id] })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/admin/objects/${created.body.id}/images/${image1.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterDelete = await request(app.getHttpServer())
      .get(`/api/objects/${created.body.slug}`)
      .expect(200);
    expect(afterDelete.body.images).toHaveLength(1);
  });
});
