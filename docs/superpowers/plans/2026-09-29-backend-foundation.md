# Backend Foundation (API + Auth + Bot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the NestJS backend (REST API, admin auth, file uploads, Telegram
notification bot) that the public site and admin panel will consume. This is
Plan 1 of a 4-plan sequence (Backend → Site → Admin → Deploy); it is fully
testable on its own via HTTP without any frontend.

**Architecture:** Single NestJS 11 application (`apps/backend`) inside a pnpm
monorepo, PostgreSQL 18 via Prisma 7. One feature module per resource
(objects/services/advantages/team/settings/reviews/leads/uploads/auth/
telegram), each with its own controller/service/DTOs and Jest tests (unit +
e2e via supertest against a real local Postgres test database). JWT-based
auth protects every `/api/admin/*` route; public `GET` (and two public
`POST`) routes need no auth. A small grammY bot runs in-process inside the
same Nest app and is triggered by the Reviews/Leads services.

**Tech Stack:** Node.js 24 LTS, TypeScript, NestJS 11, Prisma 7, PostgreSQL
18, pnpm workspaces, Jest + supertest, class-validator/class-transformer,
passport-jwt, bcryptjs, multer + sharp, grammY 1.46, @nestjs/throttler.

**Spec:** [docs/superpowers/specs/2026-09-29-kambyrstroi-platform-design.md](../specs/2026-09-29-kambyrstroi-platform-design.md)

## Global Constraints

- Backend framework: NestJS (per spec §2) — this plan pins **NestJS 11**
  specifically (not the just-released v12) because v11 is the current
  "most stable" production line; v12's ESM/Vitest/oxlint/Rspack toolchain
  migration is optional and can be adopted later without changing any
  application code below.
- ORM: Prisma (per spec §2) — pinned to **Prisma 7** (the recommended
  production version; Prisma 8 is still a release candidate as of this
  plan's writing).
- DB: **PostgreSQL 18** (per spec §2, "PostgreSQL 16+" — 18 is current
  stable).
- Monorepo: **pnpm workspaces**, no Nx/Turborepo (spec §2, §12).
- All API routes are prefixed `/api` (spec §6).
- Public `GET` endpoints require no auth; `/api/admin/*` requires a valid
  JWT (spec §6).
- `POST /api/reviews` and `POST /api/leads` are public but must be
  rate-limited (spec §6, §9) — use `@nestjs/throttler`.
- One admin account only, login+password, no roles (spec §7, §12).
- Uploaded images are resized + converted to webp via `sharp`, stored on
  disk, served later by Nginx directly (spec §4, §6) — the backend never
  serves the files itself, it only writes them into the shared uploads
  directory and returns their public URL.
- Telegram notifications (new lead / new review) must never block or fail
  the request that created the record — best-effort, caught and logged
  (spec §6, §9).
- **Naming note (implementation detail, not a spec deviation):** the
  spec's `Object` / `ObjectImage` entities are implemented here as Prisma
  models `Project` / `ProjectImage`. A Prisma model named `Object` would
  generate a TypeScript type called `Object`, shadowing the built-in
  global `Object` type everywhere in the codebase — a real, well-known
  Prisma/TS footgun. All REST routes, DTOs, and JSON fields still use the
  business term **"object"** (`/api/objects`, `workType`, etc.) so the API
  contract matches the spec exactly; only the internal Prisma/TS class
  name differs.

---

## Task 1: Monorepo scaffold + local Postgres

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `.nvmrc`
- Create: `.gitignore` (already exists — extend if needed)
- Create: `docker-compose.dev.yml`
- Create: `.editorconfig`

**Interfaces:**
- Produces: a pnpm workspace with an `apps/` and `packages/` directory
  convention that Task 2 (backend app) will populate, and a local Postgres
  instance reachable at `localhost:55432` for development/tests (55432
  rather than the more common 5433, which collided with a local SSH
  tunnel in the reference environment).

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "kambyrstroi",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "dev:backend": "pnpm --filter backend dev",
    "test:backend": "pnpm --filter backend test",
    "test:backend:e2e": "pnpm --filter backend test:e2e"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `.nvmrc`**

```
24
```

- [ ] **Step 4: Create `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 5: Create `docker-compose.dev.yml`** (local Postgres only —
  the full production compose file with backend/nginx comes in Task 15)

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: kambyrstroi
      POSTGRES_PASSWORD: kambyrstroi_dev
      POSTGRES_DB: kambyrstroi
    ports:
      - "55432:5432"
    volumes:
      - kambyrstroi_pg_dev:/var/lib/postgresql

volumes:
  kambyrstroi_pg_dev:
```

- [ ] **Step 6: Start Postgres and verify it accepts connections**

Run:
```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U kambyrstroi
```
Expected: `accepting connections`

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .nvmrc .editorconfig docker-compose.dev.yml
git commit -m "chore: scaffold pnpm monorepo + dev postgres"
```

---

## Task 2: NestJS app scaffold + health check

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/tsconfig.build.json`
- Create: `apps/backend/nest-cli.json`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/health/health.controller.ts`
- Test: `apps/backend/test/health.e2e-spec.ts`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/.env` (local only, gitignored)

**Interfaces:**
- Consumes: nothing (first backend code)
- Produces: a running Nest app on `PORT` (default 3000) with global prefix
  `api`, global `ValidationPipe`, and `GET /api/health` → `{ status: "ok" }`.
  Every later task's controller is mounted onto the `AppModule` created
  here.

- [ ] **Step 1: Install Nest CLI and scaffold the app**

Run from repo root:
```bash
pnpm dlx @nestjs/cli@11 new apps/backend --package-manager pnpm --skip-git --strict
```
This generates the standard Nest 11 CommonJS/Jest project structure under
`apps/backend`. Delete the generated `apps/backend/.git` if present (the
CLI sometimes inits a nested repo): `rm -rf apps/backend/.git`.

- [ ] **Step 2: Write the failing e2e test for the health endpoint**

```typescript
// apps/backend/test/health.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
```

- [ ] **Step 2b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- health.e2e-spec.ts`
Expected: FAIL (`Cannot find module '../src/health/health.controller'` or
404 on `/api/health`, since it doesn't exist yet).

- [ ] **Step 3: Create the health controller**

```typescript
// apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: Wire it into `AppModule`**

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 4b: Install `class-validator`/`class-transformer`**

`ValidationPipe` needs these as peer deps even for the trivial health
check test — install them now rather than hitting a runtime
`PackageLoader` error:

```bash
pnpm --filter backend add class-validator class-transformer
```

- [ ] **Step 5: Set global prefix and validation pipe in `main.ts`**

```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 6: Create `.env.example`**

```bash
# apps/backend/.env.example
PORT=3000
DATABASE_URL="postgresql://kambyrstroi:kambyrstroi_dev@localhost:55432/kambyrstroi?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
ADMIN_LOGIN="admin"
ADMIN_PASSWORD="change-me"
TELEGRAM_BOT_TOKEN=""
UPLOADS_DIR="./uploads"
PUBLIC_UPLOADS_BASE_URL="http://localhost:3000/uploads"
CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=10
```

Copy it to a real local `.env` (gitignored): `cp apps/backend/.env.example apps/backend/.env`

- [ ] **Step 7: Run the e2e test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- health.e2e-spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): scaffold NestJS app with health endpoint"
```

---

## Task 3: Prisma schema + PrismaService

**⚠️ Prisma ORM 7 architecture note (discovered during execution, not
obvious from the docs at plan-writing time):** Prisma 7 removed the
`datasource.url` field from `schema.prisma` entirely, moved the
connection string to a new `prisma.config.ts` file (used by the CLI for
migrations), and now **requires a driver adapter** to be passed to
`PrismaClient` at runtime for every database, including PostgreSQL —
there is no more "just reads `DATABASE_URL` from the schema" mode. This
task's steps below reflect that: they install `@prisma/adapter-pg` +
`pg` + `dotenv`, add `prisma.config.ts`, and construct `PrismaService`
with a `PrismaPg` adapter instead of a bare `new PrismaClient()`.

**Files:**
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma.config.ts`
- Create: `apps/backend/src/prisma/prisma.service.ts`
- Create: `apps/backend/src/prisma/prisma.module.ts`
- Create: `apps/backend/test/jest.setup.ts`
- Modify: `apps/backend/test/jest-e2e.json` (add `setupFiles`)
- Modify: `apps/backend/package.json` (add `setupFiles` to the inline
  unit-test jest config)
- Test: `apps/backend/src/prisma/prisma.service.spec.ts`

**Interfaces:**
- Produces: `PrismaModule` (global) exporting `PrismaService`, injectable
  into every later feature module. `PrismaService` extends `PrismaClient`
  and connects on module init.
- All Prisma models used by later tasks are defined here: `AdminUser`,
  `TelegramSubscriber`, `SiteSettings`, `Service`, `Advantage`,
  `TeamMember`, `Project`, `ProjectImage`, `Review` (+ `ReviewStatus`
  enum), `Lead`.
- Every unit and e2e test from here on relies on `apps/backend/test/
  jest.setup.ts` loading `.env` before any test file runs — without it,
  `PrismaService`'s constructor (which reads `process.env.DATABASE_URL`
  synchronously to build the adapter) throws immediately.

- [ ] **Step 1: Install Prisma + the Postgres driver adapter**

```bash
pnpm --filter backend add @prisma/client@7 @prisma/adapter-pg pg dotenv
pnpm --filter backend add -D prisma@7 @types/pg
```

pnpm may print `[ERR_PNPM_IGNORED_BUILDS]` for `@prisma/engines`/`prisma`
(their postinstall scripts are blocked by default). Fix it by adding
both to `allowBuilds: true` in the root `pnpm-workspace.yaml`, then
re-run `pnpm install`:

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
allowBuilds:
  '@parcel/watcher': true
  '@prisma/engines': true
  prisma: true
  unrs-resolver: true
```

- [ ] **Step 2: Write the full schema (note: no `url` in `datasource` —
  that lives in `prisma.config.ts`, Step 2b)**

```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model AdminUser {
  id           String   @id @default(uuid())
  login        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())

  @@map("admin_users")
}

model TelegramSubscriber {
  id        String   @id @default(uuid())
  chatId    String   @unique
  createdAt DateTime @default(now())

  @@map("telegram_subscribers")
}

model SiteSettings {
  id                    Int      @id @default(1)
  heroTitle             String   @default("")
  heroSubtitle          String   @default("")
  aboutText             String   @default("")
  yearsOfExperience     Int      @default(0)
  completedObjectsCount Int      @default(0)
  warrantyMonths        Int      @default(0)
  phone                 String   @default("")
  email                 String   @default("")
  workHours             String   @default("")
  vkUrl                 String   @default("")
  updatedAt             DateTime @updatedAt

  @@map("site_settings")
}

model Service {
  id          String   @id @default(uuid())
  title       String
  description String
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("services")
}

model Advantage {
  id          String   @id @default(uuid())
  title       String
  description String
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("advantages")
}

model TeamMember {
  id        String   @id @default(uuid())
  name      String
  role      String
  photoUrl  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("team_members")
}

/// Business entity is "объект" (renovation project). Named `Project` in
/// Prisma/TS to avoid colliding with the global TS `Object` type — see
/// "Naming note" in the plan's Global Constraints. REST routes and DTOs
/// still use "object" terminology.
model Project {
  id          String         @id @default(uuid())
  slug        String         @unique
  title       String
  workType    String
  description String
  year        Int
  isPublished Boolean        @default(false)
  isFeatured  Boolean        @default(false)
  order       Int            @default(0)
  images      ProjectImage[]
  reviews     Review[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("objects")
}

model ProjectImage {
  id        String  @id @default(uuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  url       String
  order     Int     @default(0)
  isCover   Boolean @default(false)

  @@map("object_images")
}

enum ReviewStatus {
  pending
  approved
  rejected
  hidden
}

model Review {
  id        String       @id @default(uuid())
  name      String
  rating    Int
  text      String
  photoUrl  String?
  projectId String?
  project   Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  status    ReviewStatus @default(pending)
  createdAt DateTime     @default(now())

  @@map("reviews")
}

model Lead {
  id          String   @id @default(uuid())
  name        String
  phone       String
  comment     String?
  isProcessed Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("leads")
}
```

- [ ] **Step 2b: Create `prisma.config.ts`** (repo root of the backend
  app — this is what the CLI reads the connection string from now)

```typescript
// apps/backend/prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

- [ ] **Step 3: Run the first migration**

```bash
cd apps/backend
pnpm exec prisma migrate dev --name init
```
Expected: `Loaded Prisma config from prisma.config.ts.` then the
migration applies cleanly against the Task 1 Postgres and Prisma Client
is generated. If it instead errors with `Authentication failed`, check
nothing else on the host is already listening on the Postgres port
(Task 1's note about port 55432 vs. 5433) before assuming the
credentials are wrong.

- [ ] **Step 4: Write the failing test for `PrismaService`**

```typescript
// apps/backend/src/prisma/prisma.service.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('connects and can run a trivial query', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    expect(result).toEqual([{ ok: 1 }]);
    await prisma.$disconnect();
  });
});
```

- [ ] **Step 4b: Run it to verify it fails**

Run: `pnpm --filter backend test -- prisma.service.spec.ts`
Expected: FAIL (`Cannot find module './prisma.service'`)

- [ ] **Step 4c: Add a jest setup file that loads `.env` before tests
  run** — required because `PrismaService`'s constructor (Step 5) reads
  `process.env.DATABASE_URL` synchronously, and neither jest config
  loads `.env` on its own.

```typescript
// apps/backend/test/jest.setup.ts
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../.env') });
```

Wire it into both jest configs:

```json
// apps/backend/test/jest-e2e.json — add "setupFiles"
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "setupFiles": ["<rootDir>/jest.setup.ts"],
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

```json
// apps/backend/package.json — inline "jest" config, add "setupFiles"
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "setupFiles": ["<rootDir>/../test/jest.setup.ts"],
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

- [ ] **Step 5: Implement `PrismaService` and `PrismaModule` (with the
  Postgres driver adapter)**

```typescript
// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// apps/backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Register `PrismaModule` in `AppModule`**

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 7: Run the test again to verify it passes**

Run: `pnpm --filter backend test -- prisma.service.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/backend/prisma apps/backend/src/prisma apps/backend/package.json apps/backend/pnpm-lock.yaml apps/backend/src/app.module.ts
git commit -m "feat(backend): add Prisma schema and PrismaService"
```

---

## Task 4: Global validation, error shape, rate limiting

**Files:**
- Create: `apps/backend/src/common/filters/http-exception.filter.ts`
- Modify: `apps/backend/src/main.ts`
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/error-shape.e2e-spec.ts`

**Interfaces:**
- Produces: every thrown `HttpException` (including `ValidationPipe`
  failures) is serialized as `{ statusCode, message, error }`, and every
  route (except `health`, and later the two public POSTs) is subject to a
  global `ThrottlerGuard` using `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` from
  env — later tasks apply a tighter `@Throttle()` override on
  `POST /api/reviews` and `POST /api/leads` specifically.

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/error-shape.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Error shape (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a consistent JSON shape for 404s', async () => {
    const res = await request(app.getHttpServer()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: expect.any(String),
        error: expect.any(String),
      }),
    );
  });
});
```

- [ ] **Step 1b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- error-shape.e2e-spec.ts`
Expected: FAIL (`Cannot find module '../src/common/filters/http-exception.filter'`)

- [ ] **Step 2: Implement the exception filter**

```typescript
// apps/backend/src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = isHttp ? exception.getResponse() : null;
    const message =
      body && typeof body === 'object' && 'message' in body
        ? (body as { message: string | string[] }).message
        : isHttp
          ? exception.message
          : 'Internal server error';

    response.status(statusCode).json({
      statusCode,
      message,
      error: isHttp ? exception.name : 'InternalServerError',
    });
  }
}
```

- [ ] **Step 3: Wire the filter and throttler into `main.ts` / `AppModule`**

```bash
pnpm --filter backend add @nestjs/throttler
```

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 10),
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- error-shape.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src
git commit -m "feat(backend): global error shape + rate limiting"
```

---

## Task 5: Auth module (admin login + JWT guard)

**⚠️ Version pinning note (discovered during execution):** `pnpm add
@nestjs/jwt @nestjs/passport` installs their `latest` tags (12.x), which
are published as **ESM-only** (`"type": "module"`) — Jest's CJS
`require()` cannot load them and the test suite fails with `Must use
import to load ES Module`. Both packages' 12.x line targets NestJS 12;
since this plan pins NestJS 11, install their **11.x** lines explicitly
instead (still plain CJS, no config workaround needed).

**Files:**
- Create: `apps/backend/src/auth/dto/login.dto.ts`
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/auth.controller.ts`
- Create: `apps/backend/src/auth/jwt.strategy.ts`
- Create: `apps/backend/src/auth/jwt-auth.guard.ts`
- Create: `apps/backend/src/auth/auth.module.ts`
- Create: `apps/backend/prisma/seed.ts`
- Modify: `apps/backend/prisma.config.ts` (add `migrations.seed`)
- Modify: `apps/backend/src/app.module.ts`
- Test: `apps/backend/test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 3)
- Produces: `POST /api/admin/auth/login` → `{ accessToken: string }`;
  `JwtAuthGuard` (from `@nestjs/passport`'s `AuthGuard('jwt')`) usable by
  `@UseGuards(JwtAuthGuard)` on every controller from Task 7 onward.
  `prisma/seed.ts` creates the one `AdminUser` from `ADMIN_LOGIN` /
  `ADMIN_PASSWORD` env vars if it doesn't already exist.

- [ ] **Step 1: Install auth deps, pinning `@nestjs/jwt` and
  `@nestjs/passport` to their NestJS-11-compatible CJS line**

```bash
pnpm --filter backend add @nestjs/passport@11 @nestjs/jwt@11 passport passport-jwt bcryptjs
pnpm --filter backend add -D @types/passport-jwt
```

(`@types/bcryptjs` is intentionally **not** installed — `bcryptjs` ships
its own types since v3 and pnpm prints a deprecation warning if you add
the old `@types/bcryptjs` package on top of it.)

- [ ] **Step 2: Write the failing e2e test**

```typescript
// apps/backend/test/auth.e2e-spec.ts
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
```

- [ ] **Step 2b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- auth.e2e-spec.ts`
Expected: FAIL (module not found / 404)

- [ ] **Step 3: DTO**

```typescript
// apps/backend/src/auth/dto/login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

- [ ] **Step 4: Auth service**

```typescript
// apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(login: string, password: string): Promise<{ accessToken: string }> {
    const admin = await this.prisma.adminUser.findUnique({ where: { login } });
    if (!admin) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const accessToken = await this.jwt.signAsync({ sub: admin.id, login: admin.login });
    return { accessToken };
  }
}
```

- [ ] **Step 5: JWT strategy + guard**

```typescript
// apps/backend/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-production',
    });
  }

  async validate(payload: { sub: string }) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException();
    }
    return { id: admin.id, login: admin.login };
  }
}
```

```typescript
// apps/backend/src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 6: Controller (login + a trivial `me` route used by every
  later module's e2e tests to obtain a token)**

```typescript
// apps/backend/src/auth/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(201)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.login, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { id: string; login: string } }) {
    return req.user;
  }
}
```

- [ ] **Step 7: Module**

```typescript
// apps/backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 8: Register in `AppModule`**

```typescript
// apps/backend/src/app.module.ts (add to imports array)
import { AuthModule } from './auth/auth.module';
// ...
@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([/* unchanged */]),
    AuthModule,
  ],
  // ...
})
export class AppModule {}
```

- [ ] **Step 9: Seed script for the one admin account** (uses the same
  `PrismaPg` driver adapter as `PrismaService`, Task 3 — a bare `new
  PrismaClient()` fails under Prisma 7 the same way it would in the app)

```typescript
// apps/backend/prisma/seed.ts
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
```

Register the seed command in `prisma.config.ts` (**not**
`package.json`'s `prisma.seed` — Prisma 7 moved this too):

```typescript
// apps/backend/prisma.config.ts — add `seed` inside `migrations`
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
});
```

- [ ] **Step 10: Run the e2e test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- auth.e2e-spec.ts`
Expected: PASS

- [ ] **Step 11: Run the actual seed against local dev DB**

Run: `pnpm --filter backend exec prisma db seed`
Expected: `Admin "admin" created.` (using the values from your local `.env`)

- [ ] **Step 12: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): admin auth (JWT login + guard) and admin seed script"
```

---

## Task 6: Uploads module (image processing)

**Files:**
- Create: `apps/backend/src/uploads/image-processor.service.ts`
- Create: `apps/backend/src/uploads/uploads.controller.ts`
- Create: `apps/backend/src/uploads/uploads.module.ts`
- Test: `apps/backend/src/uploads/image-processor.service.spec.ts`
- Test: `apps/backend/test/uploads.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `JwtAuthGuard` (Task 5)
- Produces: `ImageProcessorService.process(buffer: Buffer): Promise<{
  filename: string; publicUrl: string }>` — later used by the Objects
  (Task 11), Reviews (Task 12), and Team (Task 9) modules whenever they
  accept a photo. `POST /api/admin/uploads` (multipart, field name
  `file`, JWT-protected) → `{ url: string }`.

- [ ] **Step 1: Install deps**

```bash
pnpm --filter backend add sharp multer uuid
pnpm --filter backend add -D @types/multer
```

`uuid` (v9+) ships its own types, same as `bcryptjs` — don't add
`@types/uuid` on top of it (pnpm warns it's deprecated and it's
redundant). In practice `image-processor.service.ts` below ends up using
Node's built-in `crypto.randomUUID()` instead of the `uuid` package, so
`uuid` is installed but unused by this task — harmless, and a later task
may still want it.

- [ ] **Step 2: Write the failing unit test for the processor**

```typescript
// apps/backend/src/uploads/image-processor.service.spec.ts
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ImageProcessorService } from './image-processor.service';
import sharp from 'sharp';

describe('ImageProcessorService', () => {
  const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-'));
  const service = new ImageProcessorService();

  beforeAll(() => {
    process.env.UPLOADS_DIR = uploadsDir;
    process.env.PUBLIC_UPLOADS_BASE_URL = 'http://localhost:3000/uploads';
  });

  it('resizes and converts an image to webp on disk', async () => {
    const input = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();

    const result = await service.process(input);

    expect(result.filename).toMatch(/\.webp$/);
    expect(result.publicUrl).toBe(`http://localhost:3000/uploads/${result.filename}`);

    const savedPath = `${uploadsDir}/${result.filename}`;
    expect(fs.existsSync(savedPath)).toBe(true);

    const meta = await sharp(savedPath).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1600);
  });
});
```

- [ ] **Step 2b: Run it to verify it fails**

Run: `pnpm --filter backend test -- image-processor.service.spec.ts`
Expected: FAIL (`Cannot find module './image-processor.service'`)

- [ ] **Step 3: Implement the processor**

```typescript
// apps/backend/src/uploads/image-processor.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const MAX_WIDTH = 1600;

@Injectable()
export class ImageProcessorService {
  async process(buffer: Buffer): Promise<{ filename: string; publicUrl: string }> {
    const uploadsDir = process.env.UPLOADS_DIR ?? './uploads';
    fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    const base = process.env.PUBLIC_UPLOADS_BASE_URL ?? 'http://localhost:3000/uploads';
    return { filename, publicUrl: `${base}/${filename}` };
  }
}
```

- [ ] **Step 4: Run the unit test again to verify it passes**

Run: `pnpm --filter backend test -- image-processor.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Write the failing e2e test for the upload endpoint**

```typescript
// apps/backend/test/uploads.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// A minimal valid 1×1 PNG, base64-encoded, so `sharp` can actually decode it.
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
```

- [ ] **Step 5b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- uploads.e2e-spec.ts`
Expected: FAIL (404, controller doesn't exist yet)

- [ ] **Step 6: Controller + module**

```typescript
// apps/backend/src/uploads/uploads.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageProcessorService } from './image-processor.service';

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly imageProcessor: ImageProcessorService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    const { publicUrl } = await this.imageProcessor.process(file.buffer);
    return { url: publicUrl };
  }
}
```

```typescript
// apps/backend/src/uploads/uploads.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImageProcessorService } from './image-processor.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class UploadsModule {}
```

- [ ] **Step 7: Register in `AppModule`**

```typescript
// apps/backend/src/app.module.ts — add UploadsModule to imports
import { UploadsModule } from './uploads/uploads.module';
// imports: [..., UploadsModule]
```

- [ ] **Step 8: Run the e2e test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- uploads.e2e-spec.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): image upload endpoint (sharp resize + webp)"
```

---

## Task 7: Settings module (singleton)

**Files:**
- Create: `apps/backend/src/settings/dto/update-settings.dto.ts`
- Create: `apps/backend/src/settings/settings.service.ts`
- Create: `apps/backend/src/settings/settings.controller.ts`
- Create: `apps/backend/src/settings/settings.module.ts`
- Test: `apps/backend/test/settings.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `GET /api/settings` (public), `PATCH /api/admin/settings`
  (JWT-protected). The single row always has `id = 1`; the service
  upserts it so the app works even before anyone has saved settings.

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/settings.e2e-spec.ts
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
```

- [ ] **Step 1b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- settings.e2e-spec.ts`
Expected: FAIL (404)

- [ ] **Step 2: DTO**

```typescript
// apps/backend/src/settings/dto/update-settings.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() aboutText?: string;
  @IsOptional() @IsInt() @Min(0) yearsOfExperience?: number;
  @IsOptional() @IsInt() @Min(0) completedObjectsCount?: number;
  @IsOptional() @IsInt() @Min(0) warrantyMonths?: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() workHours?: string;
  @IsOptional() @IsString() vkUrl?: string;
}
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: dto,
      create: { id: SETTINGS_ID, ...dto },
    });
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/settings/settings.controller.ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  get() {
    return this.settingsService.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/settings')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
```

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/settings/settings.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
```

Add `SettingsModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- settings.e2e-spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): site settings singleton (public GET, admin PATCH)"
```

---

## Task 8: Services module (CRUD)

**Files:**
- Create: `apps/backend/src/services/dto/create-service.dto.ts`
- Create: `apps/backend/src/services/dto/update-service.dto.ts`
- Create: `apps/backend/src/services/services.service.ts`
- Create: `apps/backend/src/services/services.controller.ts`
- Create: `apps/backend/src/services/services.module.ts`
- Test: `apps/backend/test/services.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `GET /api/services` (public, ordered), `POST
  /api/admin/services`, `PATCH /api/admin/services/:id`, `DELETE
  /api/admin/services/:id`, `PATCH /api/admin/services/reorder` (body
  `{ ids: string[] }`, sets `order` = array index) — this exact reorder
  contract is reused verbatim by Advantages (Task 9) and Team (Task 10).

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/services.e2e-spec.ts
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
```

- [ ] **Step 1b: Run it to verify it fails**

Run: `pnpm --filter backend test:e2e -- services.e2e-spec.ts`
Expected: FAIL (404)

- [ ] **Step 2: DTOs**

```typescript
// apps/backend/src/services/dto/create-service.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}
```

```typescript
// apps/backend/src/services/dto/update-service.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
```

`@nestjs/mapped-types` needs installing once (shared by every CRUD module
from here on):

```bash
pnpm --filter backend add @nestjs/mapped-types
```

- [ ] **Step 3: Service (business logic)**

```typescript
// apps/backend/src/services/services.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.service.update({ where: { id }, data: { order: index } })),
    );
    return this.findAll();
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/services/services.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('services')
  findAll() {
    return this.servicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/services')
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/services/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.servicesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/services/:id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/services/:id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
```

**Note on route order:** `admin/services/reorder` is declared before
`admin/services/:id` so Nest doesn't match `reorder` as an `:id` param.

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/services/services.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [AuthModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
```

Add `ServicesModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e test again to verify it passes**

Run: `pnpm --filter backend test:e2e -- services.e2e-spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): services CRUD module"
```

---

## Task 9: Advantages module (CRUD)

Identical pattern to Task 8, applied to `Advantage`.

**Files:**
- Create: `apps/backend/src/advantages/dto/create-advantage.dto.ts`
- Create: `apps/backend/src/advantages/dto/update-advantage.dto.ts`
- Create: `apps/backend/src/advantages/advantages.service.ts`
- Create: `apps/backend/src/advantages/advantages.controller.ts`
- Create: `apps/backend/src/advantages/advantages.module.ts`
- Test: `apps/backend/test/advantages.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `GET /api/advantages` (public), `POST/PATCH/DELETE
  /api/admin/advantages[/:id]`, `PATCH /api/admin/advantages/reorder`.

- [ ] **Step 1: Write the failing e2e test** (same shape as Task 8's,
  swap `service`/`Service` for `advantage`/`Advantage` and the field
  values, e.g. `{ title: 'Гарантия на работы', description: '12 месяцев
  гарантии на все виды работ' }`)

```typescript
// apps/backend/test/advantages.e2e-spec.ts
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
```

- [ ] **Step 1b: Run it to verify it fails** — `pnpm --filter backend
  test:e2e -- advantages.e2e-spec.ts` → FAIL (404)

- [ ] **Step 2: DTOs**

```typescript
// apps/backend/src/advantages/dto/create-advantage.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateAdvantageDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}
```

```typescript
// apps/backend/src/advantages/dto/update-advantage.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAdvantageDto } from './create-advantage.dto';

export class UpdateAdvantageDto extends PartialType(CreateAdvantageDto) {}
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/src/advantages/advantages.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';

@Injectable()
export class AdvantagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.advantage.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateAdvantageDto) {
    return this.prisma.advantage.create({ data: dto });
  }

  update(id: string, dto: UpdateAdvantageDto) {
    return this.prisma.advantage.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.advantage.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.advantage.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.findAll();
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/advantages/advantages.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdvantagesService } from './advantages.service';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class AdvantagesController {
  constructor(private readonly advantagesService: AdvantagesService) {}

  @Get('advantages')
  findAll() {
    return this.advantagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/advantages')
  create(@Body() dto: CreateAdvantageDto) {
    return this.advantagesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/advantages/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.advantagesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/advantages/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAdvantageDto) {
    return this.advantagesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/advantages/:id')
  remove(@Param('id') id: string) {
    return this.advantagesService.remove(id);
  }
}
```

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/advantages/advantages.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdvantagesController } from './advantages.controller';
import { AdvantagesService } from './advantages.service';

@Module({
  imports: [AuthModule],
  controllers: [AdvantagesController],
  providers: [AdvantagesService],
})
export class AdvantagesModule {}
```

Add `AdvantagesModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e test again to verify it passes** — PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): advantages CRUD module"
```

---

## Task 10: Team module (CRUD, with optional photo)

Same pattern again, for `TeamMember` (has an optional `photoUrl` field —
the URL comes from `POST /api/admin/uploads`, Task 6; this module does
not process images itself).

**Files:**
- Create: `apps/backend/src/team/dto/create-team-member.dto.ts`
- Create: `apps/backend/src/team/dto/update-team-member.dto.ts`
- Create: `apps/backend/src/team/team.service.ts`
- Create: `apps/backend/src/team/team.controller.ts`
- Create: `apps/backend/src/team/team.module.ts`
- Test: `apps/backend/test/team.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `GET /api/team` (public), `POST/PATCH/DELETE
  /api/admin/team[/:id]`, `PATCH /api/admin/team/reorder`.

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/team.e2e-spec.ts
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
```

- [ ] **Step 1b: Run it to verify it fails** → FAIL (404)

- [ ] **Step 2: DTOs**

```typescript
// apps/backend/src/team/dto/create-team-member.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() role: string;
  @IsOptional() @IsUrl() photoUrl?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}
```

```typescript
// apps/backend/src/team/dto/update-team-member.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamMemberDto } from './create-team-member.dto';

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/src/team/team.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({ data: dto });
  }

  update(id: string, dto: UpdateTeamMemberDto) {
    return this.prisma.teamMember.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.teamMember.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.findAll();
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/team/team.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('team')
  findAll() {
    return this.teamService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/team')
  create(@Body() dto: CreateTeamMemberDto) {
    return this.teamService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/team/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.teamService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/team/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/team/:id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
```

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/team/team.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [AuthModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
```

Add `TeamModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e test again to verify it passes** — PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): team members CRUD module"
```

---

## Task 11: Objects module (Project + ProjectImage)

The most involved module: public list/detail (published only), admin CRUD
including attaching/detaching/reordering gallery images and setting the
cover image.

**Files:**
- Create: `apps/backend/src/objects/dto/create-object.dto.ts`
- Create: `apps/backend/src/objects/dto/update-object.dto.ts`
- Create: `apps/backend/src/objects/dto/add-object-image.dto.ts`
- Create: `apps/backend/src/objects/objects.service.ts`
- Create: `apps/backend/src/objects/objects.controller.ts`
- Create: `apps/backend/src/objects/objects.module.ts`
- Create: `apps/backend/src/objects/slug.util.ts`
- Test: `apps/backend/src/objects/slug.util.spec.ts`
- Test: `apps/backend/test/objects.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces:
  - `GET /api/objects` — published only, `isFeatured` objects usable by
    the homepage grid, all published objects for the future `/objects`
    listing.
  - `GET /api/objects/:slug` — published only, 404 if not found or not
    published.
  - `POST /api/admin/objects`, `PATCH /api/admin/objects/:id`, `DELETE
    /api/admin/objects/:id`, `PATCH /api/admin/objects/reorder`
  - `POST /api/admin/objects/:id/images` (body `{ url, isCover? }` — the
    `url` comes from `POST /api/admin/uploads`, Task 6), `DELETE
    /api/admin/objects/:id/images/:imageId`, `PATCH
    /api/admin/objects/:id/images/reorder`

- [ ] **Step 1: Write the failing unit test for slug generation**

```typescript
// apps/backend/src/objects/slug.util.spec.ts
import { slugify } from './slug.util';

describe('slugify', () => {
  it('transliterates Cyrillic and lowercases', () => {
    expect(slugify('Ремонт квартиры №5')).toBe('remont-kvartiry-5');
  });

  it('collapses repeated separators', () => {
    expect(slugify('Дом  --  у моря!!!')).toBe('dom-u-morya');
  });
});
```

- [ ] **Step 1b: Run it to verify it fails**

Run: `pnpm --filter backend test -- slug.util.spec.ts`
Expected: FAIL (`Cannot find module './slug.util'`)

- [ ] **Step 2: Implement `slugify`**

```typescript
// apps/backend/src/objects/slug.util.ts
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(input: string): string {
  const transliterated = input
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('');

  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
```

- [ ] **Step 3: Run the unit test again to verify it passes**

Run: `pnpm --filter backend test -- slug.util.spec.ts`
Expected: PASS

- [ ] **Step 4: Write the failing e2e test for the objects module**

```typescript
// apps/backend/test/objects.e2e-spec.ts
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

    return created;
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
```

- [ ] **Step 4b: Run it to verify it fails** → FAIL (404, module doesn't
  exist yet)

- [ ] **Step 5: DTOs**

```typescript
// apps/backend/src/objects/dto/create-object.dto.ts
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateObjectDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() workType: string;
  @IsString() @IsNotEmpty() description: string;
  @IsInt() @Min(1900) year: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Min(0) order?: number;
}
```

```typescript
// apps/backend/src/objects/dto/update-object.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateObjectDto } from './create-object.dto';

export class UpdateObjectDto extends PartialType(CreateObjectDto) {}
```

```typescript
// apps/backend/src/objects/dto/add-object-image.dto.ts
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class AddObjectImageDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
```

- [ ] **Step 6: Service**

```typescript
// apps/backend/src/objects/objects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { AddObjectImageDto } from './dto/add-object-image.dto';
import { slugify } from './slug.util';

@Injectable()
export class ObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- public ---

  findAllPublished() {
    return this.prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async findOnePublishedBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, isPublished: true },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!project) {
      throw new NotFoundException('Объект не найден');
    }
    return project;
  }

  // --- admin ---

  findAllForAdmin() {
    return this.prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.project.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(dto: CreateObjectDto) {
    const slug = await this.uniqueSlug(dto.title);
    return this.prisma.project.create({ data: { ...dto, slug } });
  }

  update(id: string, dto: UpdateObjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.project.update({ where: { id }, data: { order: index } })),
    );
    return this.findAllForAdmin();
  }

  // --- gallery ---

  async addImage(projectId: string, dto: AddObjectImageDto) {
    if (dto.isCover) {
      await this.prisma.projectImage.updateMany({
        where: { projectId },
        data: { isCover: false },
      });
    }
    const count = await this.prisma.projectImage.count({ where: { projectId } });
    return this.prisma.projectImage.create({
      data: { projectId, url: dto.url, isCover: dto.isCover ?? false, order: count },
    });
  }

  async removeImage(projectId: string, imageId: string) {
    return this.prisma.projectImage.delete({ where: { id: imageId } });
  }

  async reorderImages(projectId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.projectImage.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.prisma.projectImage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }
}
```

- [ ] **Step 7: Controller**

```typescript
// apps/backend/src/objects/objects.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { AddObjectImageDto } from './dto/add-object-image.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Get('objects')
  findAllPublished() {
    return this.objectsService.findAllPublished();
  }

  @Get('objects/:slug')
  findOne(@Param('slug') slug: string) {
    return this.objectsService.findOnePublishedBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/objects')
  findAllForAdmin() {
    return this.objectsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/objects')
  create(@Body() dto: CreateObjectDto) {
    return this.objectsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.objectsService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateObjectDto) {
    return this.objectsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/objects/:id')
  remove(@Param('id') id: string) {
    return this.objectsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/objects/:id/images')
  addImage(@Param('id') id: string, @Body() dto: AddObjectImageDto) {
    return this.objectsService.addImage(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/:id/images/reorder')
  reorderImages(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.objectsService.reorderImages(id, dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/objects/:id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.objectsService.removeImage(id, imageId);
  }
}
```

**Note on route order:** `admin/objects/reorder` is declared before
`admin/objects/:id` for the same reason as Task 8.

- [ ] **Step 8: Module + registration**

```typescript
// apps/backend/src/objects/objects.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ObjectsController } from './objects.controller';
import { ObjectsService } from './objects.service';

@Module({
  imports: [AuthModule],
  controllers: [ObjectsController],
  providers: [ObjectsService],
})
export class ObjectsModule {}
```

Add `ObjectsModule` to `AppModule`'s `imports`.

- [ ] **Step 9: Run the e2e tests again to verify they pass**

Run: `pnpm --filter backend test:e2e -- objects.e2e-spec.ts`
Expected: PASS (both `it` blocks)

- [ ] **Step 10: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): objects module with gallery management and slug generation"
```

---

## Task 12: Reviews module (public submit + moderation)

**Files:**
- Create: `apps/backend/src/reviews/dto/create-review.dto.ts`
- Create: `apps/backend/src/reviews/dto/update-review.dto.ts`
- Create: `apps/backend/src/reviews/reviews.service.ts`
- Create: `apps/backend/src/reviews/reviews.controller.ts`
- Create: `apps/backend/src/reviews/reviews.module.ts`
- Test: `apps/backend/test/reviews.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `GET /api/reviews` (public, `status = approved` only),
  `POST /api/reviews` (public, rate-limited tighter than the global
  default, creates with `status = pending`), `GET /api/admin/reviews`
  (all statuses), `PATCH /api/admin/reviews/:id` (edit fields or change
  `status`), `DELETE /api/admin/reviews/:id`.
  `ReviewsService.create()` returns the created review; **Task 14** wraps
  the controller's `create` call so it also notifies Telegram — this task
  does not implement notification, it only leaves the hook point
  (`ReviewsService` is what Task 14 injects `TelegramNotifierService`
  into).

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/reviews.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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
```

- [ ] **Step 1b: Run it to verify it fails** → FAIL (404)

- [ ] **Step 2: DTOs**

```typescript
// apps/backend/src/reviews/dto/create-review.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString() @IsNotEmpty() name: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @IsNotEmpty() text: string;
  @IsOptional() @IsUrl() photoUrl?: string;
  @IsOptional() @IsString() projectId?: string;
}
```

```typescript
// apps/backend/src/reviews/dto/update-review.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpdateReviewDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
}
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/src/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findApproved() {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.approved },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdmin() {
    return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: { ...dto, status: ReviewStatus.pending } });
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/reviews/reviews.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  findApproved() {
    return this.reviewsService.findApproved();
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reviews')
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/reviews')
  findAllForAdmin() {
    return this.reviewsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/reviews/:id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/reviews/:id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
```

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
```

Add `ReviewsModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e tests again to verify they pass** — PASS
  (all three `it` blocks)

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): reviews module (public submit + moderation)"
```

---

## Task 13: Leads module (contact form inbox)

**Files:**
- Create: `apps/backend/src/leads/dto/create-lead.dto.ts`
- Create: `apps/backend/src/leads/dto/update-lead.dto.ts`
- Create: `apps/backend/src/leads/leads.service.ts`
- Create: `apps/backend/src/leads/leads.controller.ts`
- Create: `apps/backend/src/leads/leads.module.ts`
- Test: `apps/backend/test/leads.e2e-spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`
- Produces: `POST /api/leads` (public, rate-limited), `GET
  /api/admin/leads`, `PATCH /api/admin/leads/:id` (toggle
  `isProcessed`). `LeadsService.create()` is the hook point Task 14
  wraps for Telegram notification, same as `ReviewsService.create()`.

- [ ] **Step 1: Write the failing e2e test**

```typescript
// apps/backend/test/leads.e2e-spec.ts
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
```

- [ ] **Step 1b: Run it to verify it fails** → FAIL (404)

- [ ] **Step 2: DTOs**

```typescript
// apps/backend/src/leads/dto/create-lead.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsString() comment?: string;
}
```

```typescript
// apps/backend/src/leads/dto/update-lead.dto.ts
import { IsBoolean } from 'class-validator';

export class UpdateLeadDto {
  @IsBoolean()
  isProcessed: boolean;
}
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto });
  }

  update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({ where: { id }, data: dto });
  }
}
```

- [ ] **Step 4: Controller**

```typescript
// apps/backend/src/leads/leads.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('leads')
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/leads')
  findAll() {
    return this.leadsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/leads/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }
}
```

- [ ] **Step 5: Module + registration**

```typescript
// apps/backend/src/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
```

Add `LeadsModule` to `AppModule`'s `imports`.

- [ ] **Step 6: Run the e2e tests again to verify they pass** — PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): leads module (public submit + admin inbox)"
```

---

## Task 14: Telegram module (grammY bot + notifications)

**Files:**
- Create: `apps/backend/src/telegram/telegram-bot.service.ts`
- Create: `apps/backend/src/telegram/telegram-notifier.service.ts`
- Create: `apps/backend/src/telegram/telegram.module.ts`
- Modify: `apps/backend/src/reviews/reviews.service.ts`
- Modify: `apps/backend/src/reviews/reviews.module.ts`
- Modify: `apps/backend/src/leads/leads.service.ts`
- Modify: `apps/backend/src/leads/leads.module.ts`
- Test: `apps/backend/src/telegram/telegram-notifier.service.spec.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService`
- Produces: `TelegramNotifierService.notify(text: string): Promise<void>`
  — sends `text` to every row in `TelegramSubscriber`, catching and
  logging (never throwing) any Telegram API failure. `TelegramBotService`
  starts the grammY bot and handles `/start` by upserting the sender's
  `chatId` into `TelegramSubscriber`.

- [ ] **Step 1: Install grammY**

```bash
pnpm --filter backend add grammy
```

- [ ] **Step 2: Write the failing unit test for the notifier's
  fault-tolerance (the part with real business-logic risk — a broken
  Telegram call must not throw)**

```typescript
// apps/backend/src/telegram/telegram-notifier.service.spec.ts
import { Test } from '@nestjs/testing';
import { TelegramNotifierService } from './telegram-notifier.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TelegramNotifierService', () => {
  it('does not throw when the bot API call fails', async () => {
    const prismaMock = {
      telegramSubscriber: {
        findMany: jest.fn().mockResolvedValue([{ chatId: '123' }]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramNotifierService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    const notifier = moduleRef.get(TelegramNotifierService);
    // no TELEGRAM_BOT_TOKEN set in the test env -> sendMessage will fail internally;
    // the important assertion is that notify() itself resolves without throwing
    await expect(notifier.notify('Новая заявка от Иван')).resolves.toBeUndefined();
    expect(prismaMock.telegramSubscriber.findMany).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2b: Run it to verify it fails**

Run: `pnpm --filter backend test -- telegram-notifier.service.spec.ts`
Expected: FAIL (`Cannot find module './telegram-notifier.service'`)

- [ ] **Step 3: Implement the notifier**

```typescript
// apps/backend/src/telegram/telegram-notifier.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramNotifierService {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private readonly bot: Bot | null;

  constructor(private readonly prisma: PrismaService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = token ? new Bot(token) : null;
  }

  async notify(text: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, skipping notification');
      return;
    }

    const subscribers = await this.prisma.telegramSubscriber.findMany();
    await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          await this.bot!.api.sendMessage(subscriber.chatId, text);
        } catch (error) {
          this.logger.error(
            `Failed to notify chatId=${subscriber.chatId}: ${(error as Error).message}`,
          );
        }
      }),
    );
  }
}
```

- [ ] **Step 4: Run the unit test again to verify it passes**

Run: `pnpm --filter backend test -- telegram-notifier.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Implement the bot service (handles `/start`)**

```typescript
// apps/backend/src/telegram/telegram-bot.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, bot will not start');
      return;
    }

    this.bot = new Bot(token);

    this.bot.command('start', async (ctx) => {
      const chatId = String(ctx.chat.id);
      await this.prisma.telegramSubscriber.upsert({
        where: { chatId },
        update: {},
        create: { chatId },
      });
      await ctx.reply('Вы подписаны на уведомления о новых заявках и отзывах.');
    });

    // fire-and-forget: don't block Nest startup on Telegram's long-poll loop
    this.bot.start().catch((error) => {
      this.logger.error(`Telegram bot crashed: ${(error as Error).message}`);
    });
  }

  async onModuleDestroy() {
    await this.bot?.stop();
  }
}
```

- [ ] **Step 6: Module**

```typescript
// apps/backend/src/telegram/telegram.module.ts
import { Global, Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramNotifierService } from './telegram-notifier.service';

@Global()
@Module({
  providers: [TelegramBotService, TelegramNotifierService],
  exports: [TelegramNotifierService],
})
export class TelegramModule {}
```

`@Global()` so `TelegramNotifierService` can be injected into
`ReviewsService` and `LeadsService` without importing `TelegramModule`
into their own modules explicitly (still list it in `AppModule`'s
imports once).

- [ ] **Step 7: Register in `AppModule`** (before `ReviewsModule` and
  `LeadsModule` in the imports array, though order doesn't matter for
  `@Global()` modules as long as it's present)

```typescript
// apps/backend/src/app.module.ts — add to imports
import { TelegramModule } from './telegram/telegram.module';
// imports: [..., TelegramModule]
```

- [ ] **Step 8: Hook the notifier into `ReviewsService.create`**

```typescript
// apps/backend/src/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramNotifierService } from '../telegram/telegram-notifier.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotifier: TelegramNotifierService,
  ) {}

  findApproved() {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.approved },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdmin() {
    return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateReviewDto) {
    const review = await this.prisma.review.create({
      data: { ...dto, status: ReviewStatus.pending },
    });
    await this.telegramNotifier.notify(
      `Новый отзыв от ${review.name} (${review.rating}★):\n${review.text}`,
    );
    return review;
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
```

- [ ] **Step 9: Hook the notifier into `LeadsService.create`**

```typescript
// apps/backend/src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramNotifierService } from '../telegram/telegram-notifier.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotifier: TelegramNotifierService,
  ) {}

  findAll() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({ data: dto });
    await this.telegramNotifier.notify(
      `Новая заявка от ${lead.name}, тел. ${lead.phone}${lead.comment ? `\nКомментарий: ${lead.comment}` : ''}`,
    );
    return lead;
  }

  update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({ where: { id }, data: dto });
  }
}
```

- [ ] **Step 10: Re-run the full e2e suite to confirm nothing regressed**
  (Reviews/Leads services now depend on `TelegramNotifierService`; with no
  `TELEGRAM_BOT_TOKEN` set in the test `.env`, `notify()` just logs a
  warning and returns, per Step 3 — the existing Reviews/Leads e2e tests
  from Tasks 12–13 must still pass unchanged)

Run: `pnpm --filter backend test:e2e`
Expected: PASS (every e2e spec so far)

- [ ] **Step 11: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): telegram bot (/start) + lead/review notifications"
```

---

## Task 15: Dockerize backend + production compose

**Files:**
- Create: `apps/backend/Dockerfile`
- Create: `apps/backend/.dockerignore`
- Create: `docker-compose.yml` (production, distinct from
  `docker-compose.dev.yml`)
- Create: `nginx/nginx.conf`
- Create: `README.md` (root — run instructions for dev and prod)

**Interfaces:**
- Produces: a production image for `apps/backend`, a `docker-compose.yml`
  wiring `postgres` + `backend` + `nginx` with a shared `uploads` volume,
  and an `nginx.conf` that reverse-proxies `api.<domain>` to the backend
  container and serves `/uploads/*` directly from the shared volume (per
  spec §4). This task does not deploy anywhere — it only makes the
  backend runnable via `docker compose up` locally as a rehearsal for the
  real VPS deploy, which is Plan 4 (Deploy).

- [ ] **Step 1: Multi-stage `Dockerfile`**

```dockerfile
# apps/backend/Dockerfile
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter backend...
COPY apps/backend apps/backend
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend build

FROM node:24-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --prod --filter backend...
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/apps/backend/node_modules/.prisma apps/backend/node_modules/.prisma
EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
```

- [ ] **Step 2: `.dockerignore`**

```
node_modules
dist
uploads
.env
*.log
```

- [ ] **Step 3: production `docker-compose.yml`** (repo root)

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: kambyrstroi
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: kambyrstroi
    volumes:
      - kambyrstroi_pg_data:/var/lib/postgresql

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://kambyrstroi:${POSTGRES_PASSWORD}@postgres:5432/kambyrstroi?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      ADMIN_LOGIN: ${ADMIN_LOGIN}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      UPLOADS_DIR: /app/uploads
      PUBLIC_UPLOADS_BASE_URL: https://api.${DOMAIN}/uploads
      CORS_ORIGINS: https://${DOMAIN},https://admin.${DOMAIN}
      PORT: 3000
      THROTTLE_TTL_MS: 60000
      THROTTLE_LIMIT: 10
    volumes:
      - uploads_data:/app/uploads

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - uploads_data:/uploads:ro

volumes:
  kambyrstroi_pg_data:
  uploads_data:
```

(Site and admin services are added to this same file in Plans 2 and 3.)

- [ ] **Step 4: `nginx/nginx.conf`**

```nginx
server {
    listen 80;
    server_name api.kambyrstroi.ru;

    location /uploads/ {
        alias /uploads/;
        access_log off;
        expires 30d;
    }

    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 5: Root `README.md`**

```markdown
# Kambyrstroi

Монорепо: `apps/backend` (NestJS API + Telegram-бот), `apps/site`
(Nuxt, добавится в Plan 2), `apps/admin` (Vue admin, добавится в Plan 3).

## Разработка

    pnpm install
    docker compose -f docker-compose.dev.yml up -d
    cp apps/backend/.env.example apps/backend/.env
    pnpm --filter backend exec prisma migrate dev
    pnpm --filter backend exec prisma db seed
    pnpm dev:backend

API доступен на http://localhost:3000/api, health-check на
http://localhost:3000/api/health.

## Тесты

    pnpm test:backend
    pnpm test:backend:e2e

## Продакшн (черновой прогон локально)

    cp .env.example .env   # заполнить POSTGRES_PASSWORD, JWT_SECRET,
                            # ADMIN_LOGIN, ADMIN_PASSWORD, TELEGRAM_BOT_TOKEN, DOMAIN
    docker compose up -d --build
```

- [ ] **Step 6: Root `.env.example`** (referenced by the compose file
  and README above)

```bash
POSTGRES_PASSWORD=change-me
JWT_SECRET=change-me
ADMIN_LOGIN=admin
ADMIN_PASSWORD=change-me
TELEGRAM_BOT_TOKEN=
DOMAIN=kambyrstroi.ru
```

- [ ] **Step 7: Verify the production image builds and boots**

Run:
```bash
cp .env.example .env
docker compose build backend
docker compose up -d postgres backend
docker compose exec backend node -e "require('http').get('http://localhost:3000/api/health', r => { console.log(r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1); })"
```
Expected: prints `200`.

Then tear down: `docker compose down`

- [ ] **Step 8: Commit**

```bash
git add apps/backend/Dockerfile apps/backend/.dockerignore docker-compose.yml nginx README.md .env.example
git commit -m "chore: dockerize backend, add production compose + nginx config"
```

---

## Plan Self-Review Notes

**Spec coverage** (against
`docs/superpowers/specs/2026-09-29-kambyrstroi-platform-design.md`):

- §5 data model → Task 3 (every model present, `Object`/`ObjectImage`
  intentionally renamed `Project`/`ProjectImage` — documented in Global
  Constraints)
- §6 backend API → Tasks 5–14 cover every listed endpoint
- §6 telegram bot → Task 14
- §9 error handling → Task 4 (exception filter), Task 14 (notifier never
  throws)
- §10 testing → every task ships its own unit/e2e tests; no separate
  "testing task" needed
- §4 deploy/infra (backend half only — nginx/site/admin full wiring is
  Plan 4) → Task 15
- §8 (site) and §7 (admin panel) are **out of scope for this plan** —
  Plans 2 and 3 consume the API built here.

**Not covered here on purpose (per spec §11 and the brainstorming
conversation):** seeding real business content (services/advantages/
sample objects/reviews text) — only the one `AdminUser` is seeded. Content
seeding is its own step after all three apps exist, once real object
photos are available.
