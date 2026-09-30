# Kambyrstroi

Монорепо: `apps/backend` (NestJS API + Telegram-бот), `apps/site`
(Nuxt, публичный сайт), `apps/admin` (Vue 3 + Vite SPA, админка).

## Разработка

    pnpm install
    docker compose -f docker-compose.dev.yml up -d
    cp apps/backend/.env.example apps/backend/.env
    pnpm --filter backend exec prisma migrate dev
    pnpm --filter backend exec prisma db seed
    pnpm dev:backend

API доступен на http://localhost:3000/api, health-check на
http://localhost:3000/api/health.

В отдельном терминале — сайт:

    cp apps/site/.env.example apps/site/.env
    pnpm dev:site

Сайт доступен на http://localhost:3001.

В третьем терминале — админка:

    cp apps/admin/.env.example apps/admin/.env
    pnpm dev:admin

Админка доступна на http://localhost:3002. Логин/пароль — значения
`ADMIN_LOGIN`/`ADMIN_PASSWORD` из `apps/backend/.env` (сид создаётся
командой `prisma db seed` выше).

## Тесты

    pnpm test:backend
    pnpm test:backend:e2e
    pnpm test:admin

Для сайта — проверка типов (без отдельного test runner, см. спеку):

    pnpm --filter site exec nuxi typecheck

Для админки — проверка типов:

    pnpm --filter admin typecheck

## Продакшн (черновой прогон локально)

    cp .env.example .env   # заполнить POSTGRES_PASSWORD, JWT_SECRET,
                            # ADMIN_LOGIN, ADMIN_PASSWORD, TELEGRAM_BOT_TOKEN, DOMAIN
    docker compose up -d --build

`docker-compose.yml` (прод) и `docker-compose.dev.yml` (локальный
Postgres для разработки) используют разные имена Compose-проектов
(`kambyrstroi` и `kambyrstroi-dev`) — не переименовывайте их без
необходимости, иначе `docker compose down` одного файла может задеть
контейнеры другого.

Админка не имеет отдельного контейнера — её статическая сборка
запекается в образ `nginx` (см. `nginx/Dockerfile`) и раздаётся тем же
контейнером, что проксирует сайт и API, по адресу
`admin.<DOMAIN>` (см. `nginx/nginx.conf`).
