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
