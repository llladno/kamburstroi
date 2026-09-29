import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Settings (e2e)', () => {
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
      data: { login: 'settingsadmin', passwordHash: await bcrypt.hash('secret123', 10) },
    });
    const loginRes = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ login: 'settingsadmin', password: 'secret123' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  it('GET /api/settings returns defaults with no auth', async () => {
    const res = await request(app.getHttpServer()).get('/api/settings').expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({ heroTitle: expect.any(String), phone: expect.any(String) }),
    );
  });

  it('rejects unauthenticated updates', () => {
    return request(app.getHttpServer())
      .patch('/api/admin/settings')
      .send({ heroTitle: 'x' })
      .expect(401);
  });

  it('updates settings when authenticated, reflected in the public GET', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ heroTitle: 'Отделка под ключ', phone: '+7 (911) 144-43-15' })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/api/settings').expect(200);
    expect(res.body.heroTitle).toBe('Отделка под ключ');
    expect(res.body.phone).toBe('+7 (911) 144-43-15');
  });
});
