import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Team (e2e)', () => {
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
    await prisma.teamMember.deleteMany();
    await prisma.adminUser.create({
      data: { login: 'teamadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'teamadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.teamMember.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('supports full CRUD with an optional photoUrl', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/team')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Иван Иванов', role: 'Прораб' })
      .expect(201);

    expect(created.body.photoUrl).toBeNull();

    await request(app.getHttpServer())
      .patch(`/api/admin/team/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ photoUrl: 'http://localhost:3000/uploads/foo.webp' })
      .expect(200);

    const list = await request(app.getHttpServer()).get('/api/team').expect(200);
    expect(list.body[0].photoUrl).toBe('http://localhost:3000/uploads/foo.webp');

    await request(app.getHttpServer())
      .delete(`/api/admin/team/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
