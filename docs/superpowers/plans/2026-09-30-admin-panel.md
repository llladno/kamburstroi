# Admin Panel (apps/admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/admin` — a Vue 3 + Vite SPA that lets the (single) company admin log in and fully manage site content: objects/portfolio, services, advantages, team, review moderation, lead inbox, and site settings — through the already-complete backend admin API.

**Architecture:** Vite + Vue 3.5 + TypeScript SPA, no SSR, no Pinia (a handful of small composables with module-level reactive state are enough for one auth flag and a few resource lists). Vue Router 4/5 for the page shell. A thin hand-written `fetch` wrapper (`lib/api.ts`) talks to the NestJS backend's existing `/api/admin/*` JWT-guarded routes (see `apps/backend/src/**/*.controller.ts` — every admin endpoint this plan needs already exists and is tested). Styling reuses the same Tailwind v4 token palette as `apps/site` for visual consistency, simplified for a utilitarian internal tool (no hero/asymmetric-split requirements — DESIGN_SYSTEM.md governs the public site, not this panel). Reordering (`Object`, `Service`, `Advantage`, `TeamMember`, `ObjectImage` — the backend already exposes a `reorder` endpoint for each) is done via a small hand-rolled native-HTML5-drag-and-drop component; no drag library dependency.

**Tech Stack:** Vue 3.5, Vite (latest), vue-router (latest), TypeScript, Tailwind CSS v4 via `@tailwindcss/vite`, Vitest + jsdom for the logic-layer unit tests. Installed with plain `pnpm add` (no version pinned by hand) so pnpm resolves current releases, consistent with the rest of the repo — **except** `typescript`, which must be pinned to `^5.9.3` (matching `apps/site`): `vue-tsc@3.3.11` does not yet support TypeScript 7's new package `exports` map (`require.resolve('typescript/lib/tsc')` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`), discovered when Task 1's build verification failed on a plain `pnpm add -D typescript`.

**Spec:** `docs/superpowers/specs/2026-09-29-kambyrstroi-platform-design.md` — see §2 (stack), §5 (data model), §6 (backend API — already implemented), §7 (admin panel scope), §9 (error handling), §10 (testing). This plan implements §7 end to end against the API contract fixed by §6.

## Global Constraints

- Package name: `admin`, at `apps/admin`, added to the existing pnpm workspace (`apps/*` glob already matches it — no `pnpm-workspace.yaml` change needed).
- Vite dev server port: **3002** — already anticipated in `apps/backend/.env.example`'s `CORS_ORIGINS="http://localhost:3001,http://localhost:3002"`. Do not change that value; if the backend `.env` differs, add `http://localhost:3002` to `CORS_ORIGINS` there instead of touching `.env.example` twice.
- One JWT admin account only (already seeded — `ADMIN_LOGIN`/`ADMIN_PASSWORD` in backend env). No user management UI.
- JWT stored in `localStorage` under key `kambyrstroi_admin_token` (single constant, defined once in `src/lib/token.ts`, imported everywhere else — never re-literal the string).
- No Pinia, no axios, no UI component library, no drag-and-drop library. Native `fetch`, small composables, hand-rolled drag-and-drop. YAGNI — this is an internal single-user tool.
- All admin REST calls are prefixed `/admin` and JWT-guarded per `apps/backend/src/**/*.controller.ts`; the four content resources (`objects`, `services`, `advantages`, `team`) each expose `GET /admin/<resource>`, `POST /admin/<resource>`, `PATCH /admin/<resource>/:id`, `DELETE /admin/<resource>/:id`, `PATCH /admin/<resource>/reorder` (body `{ ids: string[] }`). Reviews expose `GET/PATCH/DELETE /admin/reviews/:id` (no reorder). Leads expose `GET /admin/leads`, `PATCH /admin/leads/:id` (body `{ isProcessed: boolean }`, no create/delete from admin). Settings is a singleton: `GET /settings` (public), `PATCH /admin/settings`. Uploads: `POST /admin/uploads` (multipart field `file`) → `{ url: string }`. Object images: `POST /admin/objects/:id/images` (body `{ url, isCover? }`), `PATCH /admin/objects/:id/images/reorder` (body `{ ids }`), `DELETE /admin/objects/:id/images/:imageId`. Auth: `POST /admin/auth/login` (body `{ login, password }`) → `{ accessToken }`; `GET /admin/auth/me`.
- Testing split (matches `apps/site` precedent and spec §10 — no heavy frontend test suite in MVP): **unit-test the pure/logic modules** (`lib/api.ts`, `lib/reorder.ts`, `lib/token.ts` usage, `composables/useAuth.ts`, `composables/useToast.ts`, `router/guard.ts`) with Vitest + jsdom. **Do not** write component tests for `.vue` files — verify pages via `vue-tsc` typecheck plus real manual browser QA against the running backend (login, CRUD, reorder, upload, moderation, settings), and verify at least one write per resource actually landed by querying Postgres directly (`docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "..."`) or refetching the public API — not just trusting a UI success toast.
- Build output is a static `dist/` (no Node runtime container for admin) — served in production by the existing shared `nginx` container, not a new one.

## File Structure

```
apps/admin/
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.vitest.json
├── .env.example
├── Dockerfile                      # not used directly by compose (nginx/Dockerfile builds it), kept for standalone `docker build` convenience — see Task 15
└── src/
    ├── main.ts
    ├── App.vue
    ├── env.d.ts
    ├── assets/css/main.css
    ├── types/api.ts                # DTO/response interfaces mirroring backend DTOs
    ├── lib/
    │   ├── token.ts                # localStorage token get/set/clear — single source of truth
    │   ├── api.ts                  # fetch wrapper, ApiError, 401 hook
    │   └── reorder.ts              # pure moveItem() array helper
    ├── composables/
    │   ├── useAuth.ts
    │   ├── useToast.ts
    │   └── useCrudResource.ts      # generic list/create/update/remove/reorder for simple resources
    ├── router/
    │   ├── guard.ts                # pure resolveRedirect() function
    │   └── index.ts
    ├── components/
    │   ├── ToastHost.vue
    │   ├── ConfirmDialog.vue
    │   ├── OrderableList.vue
    │   └── ImageUploader.vue
    ├── layouts/
    │   └── AdminLayout.vue
    └── pages/
        ├── LoginPage.vue
        ├── DashboardPage.vue
        ├── ObjectsListPage.vue
        ├── ObjectEditPage.vue
        ├── ServicesPage.vue
        ├── AdvantagesPage.vue
        ├── TeamPage.vue
        ├── ReviewsPage.vue
        ├── LeadsPage.vue
        └── SettingsPage.vue
```

---

### Task 1: Scaffold `apps/admin` (Vite + Vue 3 + TS + Tailwind v4)

**Files:**
- Create: `apps/admin/package.json`, `apps/admin/index.html`, `apps/admin/vite.config.ts`, `apps/admin/tsconfig.json`, `apps/admin/tsconfig.app.json`, `apps/admin/env.d.ts` → `apps/admin/src/env.d.ts`, `apps/admin/src/main.ts`, `apps/admin/src/App.vue`, `apps/admin/src/assets/css/main.css`, `apps/admin/.env.example`
- Modify: root `package.json` (add `dev:admin`, `build:admin`, `typecheck:admin` scripts), root `.gitignore` (add `*.tsbuildinfo` — `vue-tsc -b`'s project-reference build creates `apps/admin/tsconfig.*.tsbuildinfo`, which is a build artifact, not source)

**Interfaces:**
- Produces: a booting Vite dev server on port 3002 and a working `pnpm --filter admin build`. Later tasks add real content inside `App.vue`.

- [ ] **Step 1: Create the admin package and install base deps**

```bash
mkdir -p apps/admin/src/assets/css
cd apps/admin
```

`apps/admin/package.json`:

```json
{
  "name": "admin",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite --port 3002",
    "build": "vue-tsc -b && vite build",
    "typecheck": "vue-tsc -b --noEmit",
    "preview": "vite preview --port 3002",
    "test": "vitest run"
  }
}
```

From the repo root:

```bash
pnpm add --filter admin vue vue-router
pnpm add --filter admin -D vite @vitejs/plugin-vue typescript@^5.9.3 vue-tsc @tailwindcss/vite tailwindcss vitest jsdom @types/node
```

(`typescript` is pinned to `^5.9.3`, not left to resolve `latest` — see Global Constraints.)

- [ ] **Step 2: Add Vite/TS config**

`apps/admin/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
});
```

`apps/admin/tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.vitest.json" }
  ]
}
```

`apps/admin/tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["src/**/*.spec.ts"]
}
```

`apps/admin/tsconfig.vitest.json`:

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "node"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.ts"]
}
```

`apps/admin/src/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 3: Add entry files**

`apps/admin/index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kambyrstroi — админка</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`apps/admin/src/assets/css/main.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #ffffff;
  --color-surface: #f3f4f5;
  --color-card: #fafafb;
  --color-text: #17191b;
  --color-text-secondary: #45494d;
  --color-text-muted: #92969a;
  --color-primary: #222528;
  --color-primary-text: #ffffff;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-danger: #b3261e;
  --color-success: #1e6b3c;

  --radius-card: 12px;
  --radius-control: 8px;

  --shadow-card: 0 8px 25px rgba(20, 25, 30, 0.05);

  --font-sans: "Manrope", "Onest", "Inter", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-surface text-text font-sans antialiased;
  }
}
```

`apps/admin/src/App.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <router-view />
</template>
```

`apps/admin/src/main.ts`:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import './assets/css/main.css';

createApp(App).mount('#app');
```

(The router is wired in Task 7 — for now `main.ts` boots without it so we can verify the scaffold independently.)

- [ ] **Step 4: `.env.example`**

`apps/admin/.env.example`:

```
VITE_API_BASE=http://localhost:3000/api
```

```bash
cp apps/admin/.env.example apps/admin/.env
```

- [ ] **Step 5: Wire root scripts**

Add to root `package.json` `scripts`:

```json
"dev:admin": "pnpm --filter admin dev",
"build:admin": "pnpm --filter admin build",
"test:admin": "pnpm --filter admin test"
```

- [ ] **Step 6: Verify it boots and builds**

```bash
pnpm install
pnpm dev:admin &
sleep 3
curl -sf http://localhost:3002/ | grep -q "<div id=\"app\">" && echo OK
kill %1
pnpm build:admin
```

Expected: `OK` printed, `apps/admin/dist/index.html` exists after build.

- [ ] **Step 7: Commit**

```bash
git add apps/admin package.json pnpm-lock.yaml
git commit -m "feat(admin): scaffold Vite + Vue 3 + Tailwind v4 SPA"
```

---

### Task 2: DTO types (`src/types/api.ts`)

**Files:**
- Create: `apps/admin/src/types/api.ts`

**Interfaces:**
- Consumes: nothing (pure types).
- Produces: `ObjectItem`, `ObjectImage`, `Service`, `Advantage`, `TeamMember`, `SiteSettings`, `Review`, `ReviewStatus`, `Lead`, and their `Create*`/`Update*` payload types — used by every later task's API calls.

- [ ] **Step 1: Write the types**

`apps/admin/src/types/api.ts`:

```typescript
export interface ObjectImage {
  id: string;
  projectId: string;
  url: string;
  order: number;
  isCover: boolean;
}

export interface ObjectItem {
  id: string;
  slug: string;
  title: string;
  workType: string;
  description: string;
  year: number;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  images: ObjectImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectPayload {
  title: string;
  workType: string;
  description: string;
  year: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  order?: number;
}

export type UpdateObjectPayload = Partial<CreateObjectPayload>;

export interface Service {
  id: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  order?: number;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export type Advantage = Service;
export type CreateAdvantagePayload = CreateServicePayload;
export type UpdateAdvantagePayload = UpdateServicePayload;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  role: string;
  photoUrl?: string;
  order?: number;
}

export type UpdateTeamMemberPayload = Partial<CreateTeamMemberPayload>;

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  yearsOfExperience: number;
  completedObjectsCount: number;
  warrantyMonths: number;
  phone: string;
  email: string;
  workHours: string;
  vkUrl: string;
  updatedAt: string;
}

export type UpdateSettingsPayload = Partial<Omit<SiteSettings, 'updatedAt'>>;

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  photoUrl?: string | null;
  projectId?: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface UpdateReviewPayload {
  name?: string;
  rating?: number;
  text?: string;
  status?: ReviewStatus;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  comment?: string | null;
  isProcessed: boolean;
  createdAt: string;
}

export interface UpdateLeadPayload {
  isProcessed: boolean;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
pnpm --filter admin typecheck
```

Expected: no errors (only this file exists so far besides the scaffold).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/types
git commit -m "feat(admin): add DTO types mirroring backend admin API"
```

---

### Task 3: Token storage + `lib/api.ts` fetch wrapper

**Files:**
- Create: `apps/admin/src/lib/token.ts`, `apps/admin/src/lib/api.ts`, `apps/admin/src/lib/api.spec.ts`
- Modify: `apps/admin/vitest.config.ts` (create), `apps/admin/package.json` (test script already added in Task 1)

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_BASE` (Task 1).
- Produces: `getToken()`, `setToken(token)`, `clearToken()` from `lib/token.ts`; `api.get/post/patch/delete/upload`, `ApiError`, `setUnauthorizedHandler(handler)` from `lib/api.ts` — used by every composable and page from here on.

- [ ] **Step 1: Add Vitest config**

`apps/admin/vitest.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
});
```

- [ ] **Step 2: `lib/token.ts`**

`apps/admin/src/lib/token.ts`:

```typescript
const TOKEN_KEY = 'kambyrstroi_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 3: Write the failing tests for `lib/api.ts`**

`apps/admin/src/lib/api.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, setUnauthorizedHandler } from './api';
import { setToken, clearToken } from './token';

describe('api', () => {
  beforeEach(() => {
    clearToken();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('sends no Authorization header when there is no token', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await api.get('/settings');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('adds a Bearer Authorization header when a token is stored', async () => {
    setToken('test-token');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await api.get('/admin/leads');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('throws ApiError with the backend message on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Неверный логин или пароль' }), { status: 401 }),
    );

    await expect(api.post('/admin/auth/login', { login: 'x', password: 'y' })).rejects.toMatchObject(
      { status: 401, message: 'Неверный логин или пароль' } satisfies Partial<ApiError>,
    );
  });

  it('calls the unauthorized handler on a 401 response', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 401 }));

    await expect(api.get('/admin/leads')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('sends a FormData upload without a JSON Content-Type header', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: 'http://x/y.webp' }), { status: 200 }),
    );
    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    const result = await api.upload<{ url: string }>('/admin/uploads', file);

    expect(result.url).toBe('http://x/y.webp');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has('Content-Type')).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
  });
});
```

- [ ] **Step 4: Run to verify it fails**

```bash
pnpm --filter admin test
```

Expected: FAIL — `./api` module not found.

- [ ] **Step 5: Implement `lib/api.ts`**

`apps/admin/src/lib/api.ts`:

```typescript
import { getToken } from './token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    return body.message ?? 'Ошибка запроса';
  } catch {
    return 'Ошибка запроса';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, { ...init, headers });

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, await parseErrorMessage(response));
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<T>(path, { method: 'POST', body: formData });
  },
};
```

- [ ] **Step 6: Run to verify it passes**

```bash
pnpm --filter admin test
```

Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/lib apps/admin/vitest.config.ts
git commit -m "feat(admin): add token storage and fetch API wrapper"
```

---

### Task 4: `lib/reorder.ts` pure helper

**Files:**
- Create: `apps/admin/src/lib/reorder.ts`, `apps/admin/src/lib/reorder.spec.ts`

**Interfaces:**
- Produces: `moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[]` — used by `OrderableList.vue` (Task 6).

- [ ] **Step 1: Write the failing test**

`apps/admin/src/lib/reorder.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { moveItem } from './reorder';

describe('moveItem', () => {
  it('moves an item from the start to the end', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item from the end to the start', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('moves an item one step down', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c'];
    moveItem(original, 0, 2);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm --filter admin test
```

Expected: FAIL — `./reorder` module not found.

- [ ] **Step 3: Implement**

`apps/admin/src/lib/reorder.ts`:

```typescript
export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm --filter admin test
```

Expected: PASS, 9 tests total.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/lib/reorder.ts apps/admin/src/lib/reorder.spec.ts
git commit -m "feat(admin): add pure array reorder helper"
```

---

### Task 5: `composables/useAuth.ts`

**Files:**
- Create: `apps/admin/src/composables/useAuth.ts`, `apps/admin/src/composables/useAuth.spec.ts`

**Interfaces:**
- Consumes: `api.post`, `ApiError`, `setUnauthorizedHandler` (Task 3), `getToken`/`setToken`/`clearToken` (Task 3), `LoginPayload`/`LoginResponse` (Task 2).
- Produces: `useAuth()` → `{ isAuthenticated: ComputedRef<boolean>, login(login, password): Promise<void>, logout(): void }`. Registers itself as the API's 401 handler so any request anywhere in the app logs the user out automatically.

- [ ] **Step 1: Write the failing tests**

`apps/admin/src/composables/useAuth.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearToken, getToken } from '../lib/token';
import * as apiModule from '../lib/api';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return { ...actual, api: { ...actual.api, post: vi.fn() } };
});

describe('useAuth', () => {
  beforeEach(() => {
    clearToken();
    vi.clearAllMocks();
    // useAuth's module-level `token` ref is only initialized once per module
    // instance; without this, a dynamic import() later in the file reuses
    // the cached instance from an earlier test instead of reading the
    // token freshly from localStorage.
    vi.resetModules();
  });

  it('stores the token on successful login', async () => {
    vi.mocked(apiModule.api.post).mockResolvedValue({ accessToken: 'abc123' });
    const { useAuth } = await import('./useAuth');
    const { login, isAuthenticated } = useAuth();

    await login('admin', 'secret');

    expect(getToken()).toBe('abc123');
    expect(isAuthenticated.value).toBe(true);
  });

  it('clears the token on logout', async () => {
    const { useAuth } = await import('./useAuth');
    const { login, logout, isAuthenticated } = useAuth();
    vi.mocked(apiModule.api.post).mockResolvedValue({ accessToken: 'abc123' });
    await login('admin', 'secret');

    logout();

    expect(getToken()).toBeNull();
    expect(isAuthenticated.value).toBe(false);
  });

  it('reflects an already-stored token as authenticated', async () => {
    const { setToken } = await import('../lib/token');
    setToken('preexisting');
    const { useAuth } = await import('./useAuth');

    expect(useAuth().isAuthenticated.value).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm --filter admin test
```

Expected: FAIL — `./useAuth` module not found.

- [ ] **Step 3: Implement**

`apps/admin/src/composables/useAuth.ts`:

```typescript
import { computed, ref } from 'vue';
import { api, setUnauthorizedHandler } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/token';
import type { LoginResponse } from '../types/api';

const token = ref<string | null>(getToken());

setUnauthorizedHandler(() => {
  token.value = null;
  clearToken();
});

export function useAuth() {
  const isAuthenticated = computed(() => token.value !== null);

  async function login(login: string, password: string): Promise<void> {
    const { accessToken } = await api.post<LoginResponse>('/admin/auth/login', { login, password });
    token.value = accessToken;
    setToken(accessToken);
  }

  function logout(): void {
    token.value = null;
    clearToken();
  }

  return { isAuthenticated, login, logout };
}
```

Note: `token` is a module-level ref so every component sharing `useAuth()` sees the same authentication state — no Pinia needed for a single boolean-ish flag.

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm --filter admin test
```

Expected: PASS, 12 tests total.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/composables/useAuth.ts apps/admin/src/composables/useAuth.spec.ts
git commit -m "feat(admin): add useAuth composable with module-level auth state"
```

---

### Task 6: `composables/useToast.ts`

**Files:**
- Create: `apps/admin/src/composables/useToast.ts`, `apps/admin/src/composables/useToast.spec.ts`

**Interfaces:**
- Produces: `useToast()` → `{ toasts: Ref<Toast[]>, push(message: string, type?: 'error' | 'success'): void, dismiss(id: number): void }`. Used by `ToastHost.vue` (Task 6) and every page that surfaces API errors (spec §9).

- [ ] **Step 1: Write the failing tests**

`apps/admin/src/composables/useToast.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast with a generated id', () => {
    const { toasts, push } = useToast();
    const before = toasts.value.length;

    push('Сохранено', 'success');

    expect(toasts.value.length).toBe(before + 1);
    expect(toasts.value.at(-1)).toMatchObject({ message: 'Сохранено', type: 'success' });
  });

  it('defaults to type "error"', () => {
    const { toasts, push } = useToast();
    push('Что-то пошло не так');
    expect(toasts.value.at(-1)?.type).toBe('error');
  });

  it('removes a toast on dismiss', () => {
    const { toasts, push, dismiss } = useToast();
    push('temp');
    const id = toasts.value.at(-1)!.id;

    dismiss(id);

    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });

  it('auto-dismisses a toast after 5 seconds', () => {
    const { toasts, push } = useToast();
    push('auto-gone');
    const id = toasts.value.at(-1)!.id;

    vi.advanceTimersByTime(5000);

    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm --filter admin test
```

Expected: FAIL — `./useToast` module not found.

- [ ] **Step 3: Implement**

`apps/admin/src/composables/useToast.ts`:

```typescript
import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

export function useToast() {
  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function push(message: string, type: Toast['type'] = 'error'): void {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => dismiss(id), 5000);
  }

  return { toasts, push, dismiss };
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm --filter admin test
```

Expected: PASS, 16 tests total.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/composables/useToast.ts apps/admin/src/composables/useToast.spec.ts
git commit -m "feat(admin): add useToast composable"
```

---

### Task 7: Router with auth guard

**Files:**
- Create: `apps/admin/src/router/guard.ts`, `apps/admin/src/router/guard.spec.ts`, `apps/admin/src/router/index.ts`
- Modify: `apps/admin/src/main.ts`, `apps/admin/src/App.vue`

**Interfaces:**
- Consumes: `useAuth()` (Task 5).
- Produces: a mounted `router` used by `main.ts`; `resolveRedirect(isAuthenticated, path): string | null` — the pure decision function the guard delegates to, unit-tested in isolation from vue-router.

- [ ] **Step 1: Write the failing test for the pure guard function**

`apps/admin/src/router/guard.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveRedirect } from './guard';

describe('resolveRedirect', () => {
  it('redirects an unauthenticated visitor to /login', () => {
    expect(resolveRedirect(false, '/objects')).toBe('/login');
  });

  it('does not redirect an unauthenticated visitor already on /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull();
  });

  it('redirects an authenticated visitor away from /login', () => {
    expect(resolveRedirect(true, '/login')).toBe('/');
  });

  it('does not redirect an authenticated visitor elsewhere', () => {
    expect(resolveRedirect(true, '/objects')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm --filter admin test
```

Expected: FAIL — `./guard` module not found.

- [ ] **Step 3: Implement the pure function**

`apps/admin/src/router/guard.ts`:

```typescript
export function resolveRedirect(isAuthenticated: boolean, path: string): string | null {
  const isLoginPage = path === '/login';
  if (!isAuthenticated && !isLoginPage) return '/login';
  if (isAuthenticated && isLoginPage) return '/';
  return null;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm --filter admin test
```

Expected: PASS, 20 tests total.

- [ ] **Step 5: Wire the router**

`apps/admin/src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { resolveRedirect } from './guard';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue') },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
        { path: 'objects', name: 'objects', component: () => import('../pages/ObjectsListPage.vue') },
        { path: 'objects/new', name: 'object-new', component: () => import('../pages/ObjectEditPage.vue') },
        { path: 'objects/:id', name: 'object-edit', component: () => import('../pages/ObjectEditPage.vue') },
        { path: 'services', name: 'services', component: () => import('../pages/ServicesPage.vue') },
        { path: 'advantages', name: 'advantages', component: () => import('../pages/AdvantagesPage.vue') },
        { path: 'team', name: 'team', component: () => import('../pages/TeamPage.vue') },
        { path: 'reviews', name: 'reviews', component: () => import('../pages/ReviewsPage.vue') },
        { path: 'leads', name: 'leads', component: () => import('../pages/LeadsPage.vue') },
        { path: 'settings', name: 'settings', component: () => import('../pages/SettingsPage.vue') },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();
  const redirect = resolveRedirect(isAuthenticated.value, to.path);
  return redirect ?? true;
});

export default router;
```

- [ ] **Step 6: Mount the router**

`apps/admin/src/main.ts`:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/css/main.css';

createApp(App).use(router).mount('#app');
```

`apps/admin/src/App.vue` stays as-is (`<router-view />` already there from Task 1).

- [ ] **Step 7: Verify build/typecheck still pass**

```bash
pnpm --filter admin typecheck
```

Expected: fails only on the not-yet-created page components (`LoginPage.vue`, `AdminLayout.vue`, etc.) — that's expected; they're stubbed out in Tasks 8–13. If you're executing tasks strictly in order, create empty placeholder single-line `<template><div /></template>` files for every page/layout listed above right now so typecheck passes, then flesh each one out in its own later task.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src/router apps/admin/src/main.ts apps/admin/src/pages apps/admin/src/layouts
git commit -m "feat(admin): add router with auth guard"
```

---

### Task 8: Shared UI — `ToastHost`, `ConfirmDialog`, `OrderableList`, `ImageUploader`

**Files:**
- Create: `apps/admin/src/components/ToastHost.vue`, `apps/admin/src/components/ConfirmDialog.vue`, `apps/admin/src/components/OrderableList.vue`, `apps/admin/src/components/ImageUploader.vue`

**Interfaces:**
- Consumes: `useToast` (Task 6), `moveItem` (Task 4), `api.upload` (Task 3).
- Produces: reusable components consumed by `AdminLayout.vue`, every CRUD page, and `ObjectEditPage.vue`.

- [ ] **Step 1: `ToastHost.vue`**

```vue
<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="cursor-pointer rounded-control px-4 py-3 text-sm text-white shadow-lg"
      :class="toast.type === 'error' ? 'bg-danger' : 'bg-success'"
      @click="dismiss(toast.id)"
    >
      {{ toast.message }}
    </div>
  </div>
</template>
```

- [ ] **Step 2: `ConfirmDialog.vue`**

```vue
<script setup lang="ts">
defineProps<{ open: boolean; title: string; message?: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="w-full max-w-sm rounded-card bg-bg p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-text">{{ title }}</h2>
      <p v-if="message" class="mt-2 text-sm text-text-secondary">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-control px-4 py-2 text-sm" @click="emit('cancel')">Отмена</button>
        <button
          class="rounded-control bg-danger px-4 py-2 text-sm text-white"
          @click="emit('confirm')"
        >
          Удалить
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: `OrderableList.vue`**

```vue
<script setup lang="ts" generic="T extends { id: string }">
import { ref } from 'vue';
import { moveItem } from '../lib/reorder';

const props = defineProps<{ items: T[] }>();
const emit = defineEmits<{ reorder: [ids: string[]] }>();

const draggedIndex = ref<number | null>(null);

function onDragStart(index: number) {
  draggedIndex.value = index;
}

function onDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;
  const reordered = moveItem(props.items, draggedIndex.value, targetIndex);
  draggedIndex.value = null;
  emit('reorder', reordered.map((item) => item.id));
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      draggable="true"
      class="cursor-move rounded-card border border-border bg-card p-3"
      @dragstart="onDragStart(index)"
      @dragover.prevent
      @drop="onDrop(index)"
    >
      <slot :item="item" />
    </div>
  </div>
</template>
```

- [ ] **Step 4: `ImageUploader.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';

const emit = defineEmits<{ uploaded: [url: string] }>();
const { push } = useToast();
const uploading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const { url } = await api.upload<{ url: string }>('/admin/uploads', file);
    emit('uploaded', url);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось загрузить фото');
  } finally {
    uploading.value = false;
    if (inputRef.value) inputRef.value.value = '';
  }
}
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 rounded-control border border-border px-4 py-2 text-sm">
    <span>{{ uploading ? 'Загрузка…' : 'Загрузить фото' }}</span>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="uploading"
      @change="onFileChange"
    />
  </label>
</template>
```

- [ ] **Step 5: Verify typecheck**

```bash
pnpm --filter admin typecheck
```

Expected: no new errors from these four files.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/components
git commit -m "feat(admin): add shared toast, confirm dialog, orderable list, image uploader"
```

---

### Task 9: `AdminLayout.vue` + `LoginPage.vue`

**Files:**
- Modify: `apps/admin/src/layouts/AdminLayout.vue`, `apps/admin/src/pages/LoginPage.vue` (replace Task 7 placeholders)

**Interfaces:**
- Consumes: `useAuth` (Task 5), `ToastHost` (Task 8), Vue Router's `<router-link>`/`<router-view>`.

- [ ] **Step 1: `LoginPage.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { ApiError } from '../lib/api';

const login = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);
const { login: doLogin } = useAuth();
const router = useRouter();

async function onSubmit() {
  submitting.value = true;
  error.value = '';
  try {
    await doLogin(login.value, password.value);
    await router.push('/');
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось войти';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-4">
    <form class="w-full max-w-sm rounded-card bg-bg p-8 shadow-lg" @submit.prevent="onSubmit">
      <h1 class="text-xl font-semibold text-text">Kambyrstroi — вход</h1>
      <label class="mt-6 block text-sm text-text-secondary">
        Логин
        <input
          v-model="login"
          type="text"
          required
          class="mt-1 w-full rounded-control border border-border px-3 py-2 text-text"
        />
      </label>
      <label class="mt-4 block text-sm text-text-secondary">
        Пароль
        <input
          v-model="password"
          type="password"
          required
          class="mt-1 w-full rounded-control border border-border px-3 py-2 text-text"
        />
      </label>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="mt-6 w-full rounded-control bg-primary py-2 text-sm text-primary-text disabled:opacity-50"
      >
        {{ submitting ? 'Вход…' : 'Войти' }}
      </button>
    </form>
  </div>
</template>
```

- [ ] **Step 2: `AdminLayout.vue`**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import ToastHost from '../components/ToastHost.vue';

const { logout } = useAuth();
const router = useRouter();

const links = [
  { to: '/', label: 'Дашборд' },
  { to: '/objects', label: 'Объекты' },
  { to: '/services', label: 'Услуги' },
  { to: '/advantages', label: 'Преимущества' },
  { to: '/team', label: 'Команда' },
  { to: '/reviews', label: 'Отзывы' },
  { to: '/leads', label: 'Заявки' },
  { to: '/settings', label: 'Настройки' },
];

function onLogout() {
  logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="w-56 shrink-0 border-r border-border bg-bg p-4">
      <div class="mb-6 text-lg font-semibold text-text">Kambyrstroi</div>
      <nav class="flex flex-col gap-1">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-control px-3 py-2 text-sm text-text-secondary hover:bg-surface"
          active-class="bg-surface text-text font-medium"
          exact-active-class="bg-surface text-text font-medium"
        >
          {{ link.label }}
        </router-link>
      </nav>
      <button
        class="mt-6 w-full rounded-control border border-border px-3 py-2 text-sm text-text-secondary"
        @click="onLogout"
      >
        Выйти
      </button>
    </aside>
    <main class="flex-1 bg-surface p-8">
      <router-view :key="$route.fullPath" />
    </main>
    <ToastHost />
  </div>
</template>
```

The `:key="$route.fullPath"` is required, not cosmetic: `/objects/new` and `/objects/:id` resolve to the same `ObjectEditPage` component, so without a key Vue Router reuses the existing instance across `router.replace()` from one to the other (Task 12) instead of remounting it — `ObjectEditPage`'s `isNew`/`id` are read once from `route.params` at setup and won't pick up the new route, leaving the page showing "Новый объект" after a successful create. Caught in Task 12's manual QA (title stayed wrong after creating an object) and fixed here since it's this file's `router-view`, not that page's code, that needs to change. Every page already does its own `onMounted(fetchAll)`, so remounting on every navigation costs nothing.

- [ ] **Step 3: Manual verification**

```bash
pnpm dev:backend &
pnpm dev:admin &
```

Open `http://localhost:3002` in the browser. Confirm: unauthenticated visit to `/` redirects to `/login`; logging in with the real `ADMIN_LOGIN`/`ADMIN_PASSWORD` from `apps/backend/.env` redirects to `/` and shows the sidebar; clicking "Выйти" redirects back to `/login` and a subsequent reload of `/objects` redirects to `/login` again (token actually cleared).

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/layouts/AdminLayout.vue apps/admin/src/pages/LoginPage.vue
git commit -m "feat(admin): add login page and authenticated layout shell"
```

---

### Task 10: `DashboardPage.vue`

**Files:**
- Modify: `apps/admin/src/pages/DashboardPage.vue` (replace placeholder)

**Interfaces:**
- Consumes: `api.get` (Task 3), `Review`/`Lead` types (Task 2).

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';
import type { Lead, Review } from '../types/api';

const pendingReviews = ref(0);
const unprocessedLeads = ref(0);
const loading = ref(true);

onMounted(async () => {
  const [reviews, leads] = await Promise.all([
    api.get<Review[]>('/admin/reviews'),
    api.get<Lead[]>('/admin/leads'),
  ]);
  pendingReviews.value = reviews.filter((r) => r.status === 'pending').length;
  unprocessedLeads.value = leads.filter((l) => !l.isProcessed).length;
  loading.value = false;
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Дашборд</h1>
    <div v-if="!loading" class="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
      <router-link to="/reviews" class="rounded-card bg-card p-6 shadow-card">
        <div class="text-3xl font-semibold text-text">{{ pendingReviews }}</div>
        <div class="mt-1 text-sm text-text-secondary">отзывов на модерации</div>
      </router-link>
      <router-link to="/leads" class="rounded-card bg-card p-6 shadow-card">
        <div class="text-3xl font-semibold text-text">{{ unprocessedLeads }}</div>
        <div class="mt-1 text-sm text-text-secondary">необработанных заявок</div>
      </router-link>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Manual verification**

With both dev servers running and logged in, load `/`. Confirm the two counts match `SELECT count(*) FROM reviews WHERE status = 'pending';` and `SELECT count(*) FROM leads WHERE "isProcessed" = false;` run via `docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "..."`.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/pages/DashboardPage.vue
git commit -m "feat(admin): add dashboard with pending review/lead counts"
```

---

### Task 11: `useCrudResource.ts` + Services/Advantages/Team pages

**Files:**
- Create: `apps/admin/src/composables/useCrudResource.ts`
- Modify: `apps/admin/src/pages/ServicesPage.vue`, `apps/admin/src/pages/AdvantagesPage.vue`, `apps/admin/src/pages/TeamPage.vue` (replace placeholders)

**Interfaces:**
- Consumes: `api` (Task 3), `OrderableList`/`ConfirmDialog` (Task 8), `useToast` (Task 6).
- Produces: `useCrudResource<TItem, TCreate, TUpdate>(basePath)` → `{ items, loading, fetchAll, create, update, remove, reorder }`, reused identically by all three pages (and structurally compatible with `ObjectItem` in Task 12, though objects gets its own richer pages because of the image sub-resource).

- [ ] **Step 1: Implement the composable**

`apps/admin/src/composables/useCrudResource.ts`:

```typescript
import { ref, shallowRef } from 'vue';
import { api } from '../lib/api';

export function useCrudResource<
  TItem extends { id: string },
  TCreate = Partial<TItem>,
  TUpdate = Partial<TItem>,
>(basePath: string) {
  // shallowRef, not ref: items are plain DTOs (no nested reactivity needed),
  // and ref()'s UnwrapRef<T> inference breaks down for a generic T here —
  // shallowRef sidesteps that while still auto-unwrapping in templates.
  const items = shallowRef<TItem[]>([]);
  const loading = ref(false);

  async function fetchAll(): Promise<void> {
    loading.value = true;
    try {
      // services/advantages/team have no isPublished-style split, so the
      // backend only exposes a public GET (no admin/-prefixed GET) — see
      // src/{services,advantages,team}/*.controller.ts. Listing hits that
      // public route; every mutation below still goes through /admin/*.
      items.value = await api.get<TItem[]>(basePath);
    } finally {
      loading.value = false;
    }
  }

  async function create(payload: TCreate): Promise<TItem> {
    const created = await api.post<TItem>(`/admin${basePath}`, payload);
    items.value = [...items.value, created];
    return created;
  }

  async function update(id: string, payload: TUpdate): Promise<TItem> {
    const updated = await api.patch<TItem>(`/admin${basePath}/${id}`, payload);
    items.value = items.value.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await api.delete(`/admin${basePath}/${id}`);
    items.value = items.value.filter((item) => item.id !== id);
  }

  async function reorder(ids: string[]): Promise<void> {
    items.value = await api.patch<TItem[]>(`/admin${basePath}/reorder`, { ids });
  }

  return { items, loading, fetchAll, create, update, remove, reorder };
}
```

No unit test for this task: it is a thin, generic pass-through over `api` (already covered by Task 3's tests) with no branching logic of its own worth re-testing — the three pages below exercise it via manual QA against the real backend, per the Global Constraints testing split.

- [ ] **Step 2: `ServicesPage.vue`**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { CreateServicePayload, Service, UpdateServicePayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<Service, CreateServicePayload, UpdateServicePayload>('/services');
const { push } = useToast();

const form = reactive({ title: '', description: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(service: Service) {
  editingId.value = service.id;
  form.title = service.title;
  form.description = service.description;
}

function resetForm() {
  editingId.value = null;
  form.title = '';
  form.description = '';
}

async function onSubmit() {
  try {
    if (editingId.value) {
      await update(editingId.value, { ...form });
    } else {
      await create({ ...form });
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить услугу');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить услугу');
  } finally {
    pendingDeleteId.value = null;
  }
}

async function onReorder(ids: string[]) {
  try {
    await reorder(ids);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Услуги</h1>

    <form class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.title"
        placeholder="Название"
        required
        class="w-full rounded-control border border-border px-3 py-2"
      />
      <textarea
        v-model="form.description"
        placeholder="Описание"
        required
        rows="3"
        class="mt-2 w-full rounded-control border border-border px-3 py-2"
      />
      <div class="mt-2 flex gap-2">
        <button type="submit" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
          {{ editingId ? 'Сохранить' : 'Добавить' }}
        </button>
        <button v-if="editingId" type="button" class="text-sm text-text-secondary" @click="resetForm">
          Отмена
        </button>
      </div>
    </form>

    <OrderableList :items="items" class="mt-6 max-w-lg" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ item.title }}</div>
            <div class="text-sm text-text-secondary">{{ item.description }}</div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <button class="text-text-secondary" @click="startEdit(item)">Изменить</button>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить услугу?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
```

- [ ] **Step 3: `AdvantagesPage.vue`**

Identical to `ServicesPage.vue` with the resource path and copy swapped:

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { Advantage, CreateAdvantagePayload, UpdateAdvantagePayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<Advantage, CreateAdvantagePayload, UpdateAdvantagePayload>('/advantages');
const { push } = useToast();

const form = reactive({ title: '', description: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(advantage: Advantage) {
  editingId.value = advantage.id;
  form.title = advantage.title;
  form.description = advantage.description;
}

function resetForm() {
  editingId.value = null;
  form.title = '';
  form.description = '';
}

async function onSubmit() {
  try {
    if (editingId.value) {
      await update(editingId.value, { ...form });
    } else {
      await create({ ...form });
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить преимущество');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить преимущество');
  } finally {
    pendingDeleteId.value = null;
  }
}

async function onReorder(ids: string[]) {
  try {
    await reorder(ids);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Преимущества</h1>

    <form class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.title"
        placeholder="Название"
        required
        class="w-full rounded-control border border-border px-3 py-2"
      />
      <textarea
        v-model="form.description"
        placeholder="Описание"
        required
        rows="3"
        class="mt-2 w-full rounded-control border border-border px-3 py-2"
      />
      <div class="mt-2 flex gap-2">
        <button type="submit" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
          {{ editingId ? 'Сохранить' : 'Добавить' }}
        </button>
        <button v-if="editingId" type="button" class="text-sm text-text-secondary" @click="resetForm">
          Отмена
        </button>
      </div>
    </form>

    <OrderableList :items="items" class="mt-6 max-w-lg" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ item.title }}</div>
            <div class="text-sm text-text-secondary">{{ item.description }}</div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <button class="text-text-secondary" @click="startEdit(item)">Изменить</button>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить преимущество?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
```

- [ ] **Step 4: `TeamPage.vue`**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ImageUploader from '../components/ImageUploader.vue';
import type { CreateTeamMemberPayload, TeamMember, UpdateTeamMemberPayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<TeamMember, CreateTeamMemberPayload, UpdateTeamMemberPayload>('/team');
const { push } = useToast();

const form = reactive({ name: '', role: '', photoUrl: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(member: TeamMember) {
  editingId.value = member.id;
  form.name = member.name;
  form.role = member.role;
  form.photoUrl = member.photoUrl ?? '';
}

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.role = '';
  form.photoUrl = '';
}

async function onSubmit() {
  const payload = { name: form.name, role: form.role, photoUrl: form.photoUrl || undefined };
  try {
    if (editingId.value) {
      await update(editingId.value, payload);
    } else {
      await create(payload);
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить сотрудника');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить сотрудника');
  } finally {
    pendingDeleteId.value = null;
  }
}

async function onReorder(ids: string[]) {
  try {
    await reorder(ids);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Команда</h1>

    <form class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.name"
        placeholder="Имя"
        required
        class="w-full rounded-control border border-border px-3 py-2"
      />
      <input
        v-model="form.role"
        placeholder="Должность"
        required
        class="mt-2 w-full rounded-control border border-border px-3 py-2"
      />
      <div class="mt-2 flex items-center gap-3">
        <img v-if="form.photoUrl" :src="form.photoUrl" class="h-12 w-12 rounded-full object-cover" />
        <ImageUploader @uploaded="(url) => (form.photoUrl = url)" />
      </div>
      <div class="mt-2 flex gap-2">
        <button type="submit" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
          {{ editingId ? 'Сохранить' : 'Добавить' }}
        </button>
        <button v-if="editingId" type="button" class="text-sm text-text-secondary" @click="resetForm">
          Отмена
        </button>
      </div>
    </form>

    <OrderableList :items="items" class="mt-6 max-w-lg" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              v-if="item.photoUrl"
              :src="item.photoUrl"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div class="font-medium text-text">{{ item.name }}</div>
              <div class="text-sm text-text-secondary">{{ item.role }}</div>
            </div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <button class="text-text-secondary" @click="startEdit(item)">Изменить</button>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить сотрудника?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
```

- [ ] **Step 5: Manual verification (real backend + Postgres)**

With both dev servers running and logged in: create a service, edit it, drag-reorder two services, delete one; repeat quickly for advantages and team (including a photo upload for a team member). After each create/update, verify with:

```bash
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select title, \"order\" from services order by \"order\";"
```

(swap table/columns for `advantages` / `team_members`). Confirm the public site (`http://localhost:3001`, refetch or reload) reflects the new services/advantages/team content.

**Reload the `/services` (and `/advantages`, `/team`) page after creating an item, not just checked the client-side-appended state.** A first pass at `useCrudResource.fetchAll()` pointed `GET` at `/admin${basePath}` for every resource, copying the objects/reviews pattern — but `services`/`advantages`/`team` have no admin-only GET route (no isPublished-style split to justify one; see `src/{services,advantages,team}/*.controller.ts`), so that 404s silently (an un-awaited promise in `onMounted`, no visible error) and the page just renders whatever `create()`/`update()` optimistically appended to `items.value` client-side — looking correct until a reload proves the list never actually loaded. Caught by reloading `/services` after creating an item and seeing an empty list. Fixed by pointing `fetchAll()` at the public, unprefixed `basePath` while every mutation keeps the `/admin` prefix (already reflected in the Step 1 code above).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/composables/useCrudResource.ts apps/admin/src/pages/ServicesPage.vue apps/admin/src/pages/AdvantagesPage.vue apps/admin/src/pages/TeamPage.vue
git commit -m "feat(admin): add generic CRUD composable and services/advantages/team pages"
```

---

### Task 12: Objects — list + edit page with gallery management

**Files:**
- Modify: `apps/admin/src/pages/ObjectsListPage.vue`, `apps/admin/src/pages/ObjectEditPage.vue` (replace placeholders)

**Interfaces:**
- Consumes: `api` (Task 3), `OrderableList`/`ConfirmDialog`/`ImageUploader` (Task 8), `ObjectItem`/`CreateObjectPayload`/`UpdateObjectPayload` (Task 2). Does not use `useCrudResource` — objects need per-row navigation to an edit route and a separate image sub-resource, so plain `api` calls are more direct here.

- [ ] **Step 1: `ObjectsListPage.vue`**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ObjectItem } from '../types/api';

const objects = ref<ObjectItem[]>([]);
const pendingDeleteId = ref<string | null>(null);
const { push } = useToast();

async function load() {
  objects.value = await api.get<ObjectItem[]>('/admin/objects');
}

onMounted(load);

async function onReorder(ids: string[]) {
  try {
    objects.value = await api.patch<ObjectItem[]>('/admin/objects/reorder', { ids });
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await api.delete(`/admin/objects/${pendingDeleteId.value}`);
    objects.value = objects.value.filter((o) => o.id !== pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить объект');
  } finally {
    pendingDeleteId.value = null;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-text">Объекты</h1>
      <router-link to="/objects/new" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
        Добавить объект
      </router-link>
    </div>

    <OrderableList :items="objects" class="mt-6 max-w-2xl" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              v-if="item.images[0]"
              :src="item.images[0].url"
              class="h-12 w-16 rounded object-cover"
            />
            <div>
              <div class="font-medium text-text">{{ item.title }}</div>
              <div class="text-sm text-text-secondary">
                {{ item.workType }} · {{ item.year }}
                <span v-if="!item.isPublished" class="text-danger">· черновик</span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <router-link :to="`/objects/${item.id}`" class="text-text-secondary">Изменить</router-link>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить объект?"
      message="Фото объекта тоже будут удалены."
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
```

- [ ] **Step 2: `ObjectEditPage.vue`**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import OrderableList from '../components/OrderableList.vue';
import ImageUploader from '../components/ImageUploader.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ObjectImage, ObjectItem } from '../types/api';

const route = useRoute();
const router = useRouter();
const { push } = useToast();

const id = route.params.id as string | undefined;
const isNew = !id;

const form = reactive({
  title: '',
  workType: '',
  description: '',
  year: new Date().getFullYear(),
  isPublished: false,
  isFeatured: false,
});
const images = ref<ObjectImage[]>([]);
const savedId = ref<string | undefined>(id);
const saving = ref(false);
const pendingDeleteImageId = ref<string | null>(null);

async function load() {
  if (!id) return;
  // admin/objects has no single-item GET; fetch the list and find by id (small dataset — MVP-appropriate).
  const list = await api.get<ObjectItem[]>('/admin/objects');
  const found = list.find((o) => o.id === id);
  if (!found) return;
  form.title = found.title;
  form.workType = found.workType;
  form.description = found.description;
  form.year = found.year;
  form.isPublished = found.isPublished;
  form.isFeatured = found.isFeatured;
  images.value = found.images;
}

onMounted(load);

async function onSubmit() {
  saving.value = true;
  try {
    if (savedId.value) {
      await api.patch<ObjectItem>(`/admin/objects/${savedId.value}`, { ...form });
      push('Объект сохранён', 'success');
    } else {
      const created = await api.post<ObjectItem>('/admin/objects', { ...form });
      savedId.value = created.id;
      push('Объект создан — теперь можно добавить фото', 'success');
      await router.replace(`/objects/${created.id}`);
    }
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить объект');
  } finally {
    saving.value = false;
  }
}

async function onImageUploaded(url: string) {
  if (!savedId.value) return;
  try {
    const image = await api.post<ObjectImage>(`/admin/objects/${savedId.value}/images`, {
      url,
      isCover: images.value.length === 0,
    });
    images.value = [...images.value, image];
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось прикрепить фото');
  }
}

async function onReorderImages(ids: string[]) {
  if (!savedId.value) return;
  try {
    images.value = await api.patch<ObjectImage[]>(
      `/admin/objects/${savedId.value}/images/reorder`,
      { ids },
    );
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок фото');
  }
}

async function onConfirmDeleteImage() {
  if (!savedId.value || !pendingDeleteImageId.value) return;
  try {
    await api.delete(`/admin/objects/${savedId.value}/images/${pendingDeleteImageId.value}`);
    images.value = images.value.filter((img) => img.id !== pendingDeleteImageId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить фото');
  } finally {
    pendingDeleteImageId.value = null;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-semibold text-text">
      {{ isNew ? 'Новый объект' : 'Редактирование объекта' }}
    </h1>

    <form class="mt-6 flex flex-col gap-3 rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.title"
        placeholder="Название"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <input
        v-model="form.workType"
        placeholder="Тип работ"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <textarea
        v-model="form.description"
        placeholder="Описание"
        required
        rows="4"
        class="rounded-control border border-border px-3 py-2"
      />
      <input
        v-model.number="form.year"
        type="number"
        placeholder="Год"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="form.isPublished" type="checkbox" /> Опубликован на сайте
      </label>
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="form.isFeatured" type="checkbox" /> Показывать на главной
      </label>
      <button
        type="submit"
        :disabled="saving"
        class="w-fit rounded-control bg-primary px-4 py-2 text-sm text-primary-text disabled:opacity-50"
      >
        {{ saving ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </form>

    <section v-if="savedId" class="mt-8">
      <h2 class="text-lg font-semibold text-text">Фото объекта</h2>
      <ImageUploader class="mt-3" @uploaded="onImageUploaded" />
      <OrderableList :items="images" class="mt-4" @reorder="onReorderImages">
        <template #default="{ item }">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <img :src="item.url" class="h-14 w-20 rounded object-cover" />
              <span v-if="item.isCover" class="text-xs text-text-muted">обложка</span>
            </div>
            <button class="text-sm text-danger" @click="pendingDeleteImageId = item.id">
              Удалить
            </button>
          </div>
        </template>
      </OrderableList>
    </section>
    <p v-else class="mt-8 text-sm text-text-muted">
      Сохраните объект, чтобы добавить фото.
    </p>

    <ConfirmDialog
      :open="pendingDeleteImageId !== null"
      title="Удалить фото?"
      @confirm="onConfirmDeleteImage"
      @cancel="pendingDeleteImageId = null"
    />
  </div>
</template>
```

Note: there's no `GET /admin/objects/:id` on the backend — `load()` fetches the full admin list and finds the matching id, which is fine at this content scale (a handful of objects).

- [ ] **Step 3: Manual verification (real backend + Postgres)**

Create a new object, save it (confirm the URL becomes `/objects/<id>`), upload two photos, drag-reorder them, delete one, toggle "Опубликован", save again. Verify with:

```bash
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select title, \"isPublished\", \"order\" from objects;"
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select url, \"order\", \"isCover\" from object_images order by \"order\";"
```

Confirm the object appears (once published) on the public site's "Наши объекты" grid after a reload.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/pages/ObjectsListPage.vue apps/admin/src/pages/ObjectEditPage.vue
git commit -m "feat(admin): add objects list and editor with gallery management"
```

---

### Task 13: `ReviewsPage.vue` — moderation

**Files:**
- Modify: `apps/admin/src/pages/ReviewsPage.vue` (replace placeholder)

**Interfaces:**
- Consumes: `api` (Task 3), `Review`/`ReviewStatus`/`UpdateReviewPayload` (Task 2), `ConfirmDialog` (Task 8).

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { Review, ReviewStatus } from '../types/api';

const reviews = ref<Review[]>([]);
const filter = ref<ReviewStatus | 'all'>('pending');
const pendingDeleteId = ref<string | null>(null);
const { push } = useToast();

const filtered = computed(() =>
  filter.value === 'all' ? reviews.value : reviews.value.filter((r) => r.status === filter.value),
);

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'На модерации',
  approved: 'Опубликован',
  rejected: 'Отклонён',
  hidden: 'Скрыт',
};

async function load() {
  reviews.value = await api.get<Review[]>('/admin/reviews');
}

onMounted(load);

async function setStatus(review: Review, status: ReviewStatus) {
  try {
    const updated = await api.patch<Review>(`/admin/reviews/${review.id}`, { status });
    reviews.value = reviews.value.map((r) => (r.id === review.id ? updated : r));
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить статус отзыва');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await api.delete(`/admin/reviews/${pendingDeleteId.value}`);
    reviews.value = reviews.value.filter((r) => r.id !== pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить отзыв');
  } finally {
    pendingDeleteId.value = null;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-semibold text-text">Отзывы</h1>

    <div class="mt-4 flex gap-2 text-sm">
      <button
        v-for="option in (['pending', 'approved', 'rejected', 'hidden', 'all'] as const)"
        :key="option"
        class="rounded-control px-3 py-1"
        :class="filter === option ? 'bg-primary text-primary-text' : 'bg-card text-text-secondary'"
        @click="filter = option"
      >
        {{ option === 'all' ? 'Все' : statusLabels[option] }}
      </button>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <div v-for="review in filtered" :key="review.id" class="rounded-card bg-card p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ review.name }} · {{ review.rating }}/5</div>
            <p class="mt-1 text-sm text-text-secondary">{{ review.text }}</p>
            <img v-if="review.photoUrl" :src="review.photoUrl" class="mt-2 h-20 w-28 rounded object-cover" />
          </div>
          <span class="shrink-0 text-xs text-text-muted">{{ statusLabels[review.status] }}</span>
        </div>
        <div class="mt-3 flex gap-2 text-sm">
          <button v-if="review.status !== 'approved'" class="text-success" @click="setStatus(review, 'approved')">
            Одобрить
          </button>
          <button v-if="review.status !== 'rejected'" class="text-text-secondary" @click="setStatus(review, 'rejected')">
            Отклонить
          </button>
          <button v-if="review.status !== 'hidden'" class="text-text-secondary" @click="setStatus(review, 'hidden')">
            Скрыть
          </button>
          <button class="text-danger" @click="pendingDeleteId = review.id">Удалить</button>
        </div>
      </div>
      <p v-if="filtered.length === 0" class="text-sm text-text-muted">Нет отзывов в этой категории.</p>
    </div>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить отзыв?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
```

- [ ] **Step 2: Manual verification (real backend + Postgres)**

Submit a review through the public site's review form (`http://localhost:3001`) so a real `pending` row exists, then approve it in the admin. Confirm:

```bash
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select name, status from reviews order by \"createdAt\" desc limit 5;"
curl -s http://localhost:3000/api/reviews | grep -q "<the review's name>" && echo "now public"
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/pages/ReviewsPage.vue
git commit -m "feat(admin): add review moderation page"
```

---

### Task 14: `LeadsPage.vue`

**Files:**
- Modify: `apps/admin/src/pages/LeadsPage.vue` (replace placeholder)

**Interfaces:**
- Consumes: `api` (Task 3), `Lead`/`UpdateLeadPayload` (Task 2).

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import type { Lead } from '../types/api';

const leads = ref<Lead[]>([]);
const showProcessed = ref(false);
const { push } = useToast();

const visible = computed(() =>
  showProcessed.value ? leads.value : leads.value.filter((l) => !l.isProcessed),
);

async function load() {
  leads.value = await api.get<Lead[]>('/admin/leads');
}

onMounted(load);

async function toggleProcessed(lead: Lead) {
  try {
    const updated = await api.patch<Lead>(`/admin/leads/${lead.id}`, {
      isProcessed: !lead.isProcessed,
    });
    leads.value = leads.value.map((l) => (l.id === lead.id ? updated : l));
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось обновить заявку');
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-text">Заявки</h1>
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="showProcessed" type="checkbox" /> Показать обработанные
      </label>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <div v-for="lead in visible" :key="lead.id" class="rounded-card bg-card p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ lead.name }} · {{ lead.phone }}</div>
            <p v-if="lead.comment" class="mt-1 text-sm text-text-secondary">{{ lead.comment }}</p>
            <div class="mt-1 text-xs text-text-muted">
              {{ new Date(lead.createdAt).toLocaleString('ru-RU') }}
            </div>
          </div>
          <button
            class="shrink-0 rounded-control px-3 py-1 text-sm"
            :class="lead.isProcessed ? 'bg-surface text-text-secondary' : 'bg-primary text-primary-text'"
            @click="toggleProcessed(lead)"
          >
            {{ lead.isProcessed ? 'Обработана' : 'Отметить обработанной' }}
          </button>
        </div>
      </div>
      <p v-if="visible.length === 0" class="text-sm text-text-muted">Нет новых заявок.</p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Manual verification (real backend + Postgres)**

Submit a lead through the public site's contact form, confirm it appears in the admin inbox, mark it processed, confirm:

```bash
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select name, \"isProcessed\" from leads order by \"createdAt\" desc limit 5;"
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/pages/LeadsPage.vue
git commit -m "feat(admin): add leads inbox page"
```

---

### Task 15: `SettingsPage.vue`

**Files:**
- Modify: `apps/admin/src/pages/SettingsPage.vue` (replace placeholder)

**Interfaces:**
- Consumes: `api` (Task 3), `SiteSettings`/`UpdateSettingsPayload` (Task 2).

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import type { SiteSettings } from '../types/api';

const form = reactive<Omit<SiteSettings, 'updatedAt'>>({
  heroTitle: '',
  heroSubtitle: '',
  aboutText: '',
  yearsOfExperience: 0,
  completedObjectsCount: 0,
  warrantyMonths: 0,
  phone: '',
  email: '',
  workHours: '',
  vkUrl: '',
});
const saving = ref(false);
const { push } = useToast();

async function load() {
  const settings = await api.get<SiteSettings>('/settings');
  Object.assign(form, settings);
}

onMounted(load);

async function onSubmit() {
  saving.value = true;
  try {
    const updated = await api.patch<SiteSettings>('/admin/settings', { ...form });
    Object.assign(form, updated);
    push('Настройки сохранены', 'success');
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить настройки');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="max-w-xl" @submit.prevent="onSubmit">
    <h1 class="text-2xl font-semibold text-text">Настройки сайта</h1>

    <fieldset class="mt-6 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">Главный экран</legend>
      <input v-model="form.heroTitle" placeholder="Заголовок хиро" class="rounded-control border border-border px-3 py-2" />
      <textarea v-model="form.heroSubtitle" placeholder="Подзаголовок хиро" rows="2" class="rounded-control border border-border px-3 py-2" />
    </fieldset>

    <fieldset class="mt-4 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">О компании</legend>
      <textarea v-model="form.aboutText" placeholder="Текст о компании" rows="4" class="rounded-control border border-border px-3 py-2" />
      <div class="grid grid-cols-3 gap-3">
        <label class="text-sm text-text-secondary">
          Лет опыта
          <input v-model.number="form.yearsOfExperience" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
        <label class="text-sm text-text-secondary">
          Объектов сдано
          <input v-model.number="form.completedObjectsCount" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
        <label class="text-sm text-text-secondary">
          Гарантия, мес.
          <input v-model.number="form.warrantyMonths" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
      </div>
    </fieldset>

    <fieldset class="mt-4 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">Контакты</legend>
      <input v-model="form.phone" placeholder="Телефон" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.email" placeholder="E-mail" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.workHours" placeholder="Режим работы" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.vkUrl" placeholder="Ссылка на ВК" class="rounded-control border border-border px-3 py-2" />
    </fieldset>

    <button
      type="submit"
      :disabled="saving"
      class="mt-4 rounded-control bg-primary px-4 py-2 text-sm text-primary-text disabled:opacity-50"
    >
      {{ saving ? 'Сохранение…' : 'Сохранить' }}
    </button>
  </form>
</template>
```

- [ ] **Step 2: Manual verification (real backend + Postgres)**

Change every field, save, confirm via:

```bash
docker exec kambyrstroi-dev-postgres-1 psql -U kambyrstroi -d kambyrstroi -c "select * from site_settings;"
```

Reload the public site homepage and confirm the hero title/subtitle and contact block reflect the new values.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/pages/SettingsPage.vue
git commit -m "feat(admin): add site settings page"
```

---

### Task 16: Deployment wiring — Dockerfile via shared nginx image, compose, nginx.conf, README

**Files:**
- Create: `apps/admin/Dockerfile`, `nginx/Dockerfile`
- Modify: `docker-compose.yml`, `nginx/nginx.conf`, root `README.md`

**Interfaces:**
- Produces: the `nginx` service in `docker-compose.yml` now builds from `nginx/Dockerfile`, which itself builds `apps/admin` and bakes the static `dist/` into the nginx image; a new `server_name admin.kambyrstroi.ru` block serves it. `docker-compose.dev.yml` is untouched — admin runs locally via `pnpm dev:admin` in dev, exactly like backend/site already do.

- [ ] **Step 1: `apps/admin/Dockerfile`** (standalone build, for `docker build -f apps/admin/Dockerfile .` sanity checks — not referenced by compose, which uses `nginx/Dockerfile` instead so the static files end up in the same container that serves them)

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile --filter admin...
COPY apps/admin apps/admin
ARG VITE_API_BASE=http://localhost:3000/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm --filter admin build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 2: `nginx/Dockerfile`** (this is the one compose actually builds)

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile --filter admin...
COPY apps/admin apps/admin
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm --filter admin build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html/admin
```

(`nginx.conf` is still supplied at runtime via the existing read-only volume mount in `docker-compose.yml` — this Dockerfile only bakes in the static admin bundle, it does not COPY `nginx.conf`.)

- [ ] **Step 3: Update `docker-compose.yml`**

Change the `nginx` service from a plain image to a build, and add the `VITE_API_BASE` build arg:

```yaml
  nginx:
    build:
      context: .
      dockerfile: nginx/Dockerfile
      args:
        VITE_API_BASE: https://api.${DOMAIN}/api
    restart: unless-stopped
    depends_on:
      - backend
      - site
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - uploads_data:/uploads:ro
```

(Only the `nginx:` service block changes — `image: nginx:1.27-alpine` becomes the `build:` block above; everything else in the file, including `CORS_ORIGINS: https://${DOMAIN},https://admin.${DOMAIN}` on the `backend` service, already anticipated this and needs no edit.)

- [ ] **Step 4: Add the admin server block to `nginx/nginx.conf`**

Append:

```nginx
server {
    listen 80;
    server_name admin.kambyrstroi.ru;

    root /usr/share/nginx/html/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 5: Verify the production image builds and serves**

`nginx.conf`'s other two server blocks `proxy_pass` to `http://backend:3000` and `http://site:3000` — Compose service DNS names that only resolve inside the Compose network. A standalone `docker run` of just the built nginx image (without the rest of the stack) fails at startup with `host not found in upstream "backend"` — nginx refuses to start at all if *any* server block has an unresolvable upstream, even one you're not testing. So this must be verified through the full stack, not a lone container:

```bash
docker build -f nginx/Dockerfile -t kambyrstroi-nginx-test --build-arg VITE_API_BASE=https://api.kambyrstroi.ru/api .
```

Expected: build succeeds (this part alone is a safe standalone check — it only builds the image, doesn't run it).

```bash
POSTGRES_PASSWORD=test JWT_SECRET=test ADMIN_LOGIN=admin ADMIN_PASSWORD=test TELEGRAM_BOT_TOKEN= DOMAIN=kambyrstroi.ru docker compose up -d --build
sleep 3
curl -sf -H "Host: admin.kambyrstroi.ru" http://localhost/ | grep -q "Kambyrstroi — админка" && echo OK
docker compose down
```

Expected: `OK` printed. If you only want to sanity-check that the nginx config itself parses (without the cost of building backend/site too), `docker compose config` validates the compose file, and `docker run --rm --entrypoint nginx -v "$(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro" kambyrstroi-nginx-test -t` will still fail on the unresolvable upstreams — that failure is expected and does not indicate a problem with the admin server block; only the full-stack run is conclusive.

- [ ] **Step 6: Update root README**

Add an "Админка" entry to the run-instructions section, mirroring the existing "Сайт" entry: dev command `pnpm dev:admin` → `http://localhost:3002`, and a note that in production it's served by the shared `nginx` container at `admin.<домен>` (no separate container/port).

- [ ] **Step 7: Commit**

```bash
git add apps/admin/Dockerfile nginx/Dockerfile docker-compose.yml nginx/nginx.conf README.md
git commit -m "feat(admin): serve admin SPA as a static bundle from the shared nginx image"
```

---

### Task 17: Full manual walkthrough + finish

**Files:** none (verification only)

- [ ] **Step 1: Run the admin test suite and typecheck one more time**

```bash
pnpm --filter admin test
pnpm --filter admin typecheck
pnpm build:admin
```

Expected: all green, build succeeds.

- [ ] **Step 2: Full local walkthrough against real backend + Postgres**

With `docker compose -f docker-compose.dev.yml up -d`, `pnpm dev:backend`, `pnpm dev:site`, and `pnpm dev:admin` all running:

1. Visit `http://localhost:3002/objects` while logged out → redirected to `/login`.
2. Log in with the real admin credentials → redirected to `/`, dashboard counts load.
3. Walk every page (Objects, Services, Advantages, Team, Reviews, Leads, Settings) and perform at least one create/update/delete/reorder where applicable, cross-checking each write against Postgres as described in that task's verification step.
4. Confirm the public site at `http://localhost:3001` reflects the changes after a reload (objects grid, services teaser, advantages, settings-driven hero/contacts).
5. Click "Выйти", confirm redirect to `/login` and that a direct visit to `/settings` afterward redirects to `/login` again (token actually cleared, not just UI-hidden).

- [ ] **Step 3: Use the finishing-a-development-branch skill**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." Follow it: verify `pnpm --filter admin test` is green (already done above), detect the git/worktree environment, present the merge/PR/keep-as-is menu, and execute whichever option is chosen.
