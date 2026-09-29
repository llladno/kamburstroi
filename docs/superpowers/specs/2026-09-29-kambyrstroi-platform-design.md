# Kambyrstroi — сайт, админка, бэкенд, бот. Дизайн-спека

Дата: 2026-09-29
Статус: утверждена пользователем, готова к переходу в implementation plan

## 1. Контекст и цели

Сайт-визитка небольшой строительной/отделочной организации (кайфбырстрой /
kambyrstroi), созданный по требованиям `tz.md`, с визуальным языком из
`DESIGN_SYSTEM.md` / `AI_PROMPT.md` (премиальный минимализм, асимметричный
хиро 55/45, скруглённая геометрия, монохромная палитра).

Цели:

- Публичный сайт с разделами: Главная, Об организации, Наши объекты,
  Отзывы, Контакты.
- Простая админ-панель, чтобы сотрудник компании сам менял контент без
  участия разработчика.
- Приём заявок ("оставить заявку") и отзывов с модерацией.
- Telegram-бот с push-уведомлениями о новых заявках/отзывах.
- Блог **не делаем** на этом этапе (осознанно вынесено из скоупа
  пользователем).

## 2. Технологический стек

| Слой | Технология | Примечание |
|---|---|---|
| Публичный сайт | Nuxt 4 (Vue 3), SSR | SEO, скорость первой загрузки |
| Админка | Vue 3 + Vite (SPA) | без SSR — внутренний инструмент |
| Бэкенд + API | NestJS 11 | REST API |
| Бот | grammY, встроен в процесс backend | только push-уведомления + `/start` |
| БД | PostgreSQL 16+ | |
| ORM | Prisma | |
| Стили | Tailwind CSS v4 | токены из DESIGN_SYSTEM.md как CSS-переменные/тема |
| Монорепо | pnpm workspaces | без Nx/Turborepo — не требуется для 3 приложений |
| Хранение файлов | диск сервера (Docker volume) + Nginx static | без внешнего object storage |
| Деплой | Docker Compose на своём VPS | без сложного CI на первом этапе |

## 3. Структура репозитория

```
kambyrstroi/
├── apps/
│   ├── site/        — Nuxt 4, публичный сайт
│   ├── admin/        — Vue 3 + Vite SPA, админка
│   └── backend/      — NestJS, REST API + Telegram-бот
├── packages/
│   └── shared/       — общие TS-типы (DTO/модели)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## 4. Инфраструктура и домены

- `kambyrstroi.ru` → Nuxt site (SSR)
- `admin.kambyrstroi.ru` → Vue admin SPA (статика)
- `api.kambyrstroi.ru` → NestJS backend
- Postgres — только во внутренней Docker-сети, не публикуется
- Загруженные фото — Docker volume, раздача напрямую через Nginx
  (`/uploads/...`), backend только принимает upload и обрабатывает
  (`sharp`: resize + конвертация в webp)
- CI/CD — вне скоупа MVP; деплой вручную через `docker compose up -d
  --build` по SSH. Может быть добавлен позже отдельным этапом (GitHub
  Actions).

## 5. Модель данных (Prisma / PostgreSQL)

### Контент сайта

- **Object** (объект работ) — `id`, `slug`, `title`, `workType`,
  `description`, `year`, `isPublished`, `isFeatured` (показывать на
  главной), `order`, `createdAt`, `updatedAt`
- **ObjectImage** — `id`, `objectId`, `url`, `order`, `isCover`
- **Service** (услуга) — `id`, `title`, `description`, `icon?`, `order`
- **Advantage** (преимущество) — `id`, `title`, `description`, `order`
- **TeamMember** (команда, раздел "Об организации") — `id`, `name`,
  `role`, `photoUrl?`, `order`
- **SiteSettings** (синглтон, одна строка) — тексты хиро (`heroTitle`,
  `heroSubtitle`), блоки "О компании" (история/опыт/направления, как
  rich-text/markdown поля), статистика для хиро-карточек
  (`yearsOfExperience`, `completedObjectsCount`, `warrantyMonths` —
  задаются вручную, не считаются автоматически), контакты (`phone`,
  `email`, `workHours`, `vkUrl`)

### Отзывы и заявки

- **Review** — `id`, `name`, `rating` (1–5), `text`, `photoUrl?`,
  `objectId?` (необязательная привязка к объекту), `status`
  (`pending` / `approved` / `rejected` / `hidden`), `createdAt`
- **Lead** (заявка) — `id`, `name`, `phone`, `comment?`,
  `isProcessed`, `createdAt`

### Служебное

- **AdminUser** — `id`, `login`, `passwordHash` (один аккаунт админа)
- **TelegramSubscriber** — `id`, `chatId`, `createdAt`

Все таблицы контента (`Object`, `Service`, `Advantage`, `TeamMember`)
поддерживают полный CRUD + ручную сортировку (`order`) в админке.

## 6. Backend API (NestJS)

Модули: `ObjectsModule`, `ServicesModule`, `AdvantagesModule`,
`TeamModule`, `SettingsModule`, `ReviewsModule`, `LeadsModule`,
`UploadsModule`, `AuthModule`, `TelegramModule`.

### Публичное API (без авторизации)

- `GET /api/objects`, `GET /api/objects/:slug` — только
  `isPublished = true`
- `GET /api/services`, `GET /api/advantages`, `GET /api/team`,
  `GET /api/settings`
- `GET /api/reviews` — только `status = approved`
- `POST /api/reviews` — публичная отправка (создаётся со `status =
  pending`, фото опционально) → триггерит Telegram-уведомление
- `POST /api/leads` — отправка заявки (имя, телефон, комментарий) →
  триггерит Telegram-уведомление

Оба `POST`-эндпоинта защищены `@nestjs/throttler` (rate-limit по IP)
+ honeypot-поле на фронте против спама.

### Админ-API (`/api/admin/*`, JWT guard)

- `POST /api/admin/auth/login` — логин/пароль → JWT
- CRUD: `objects` (+ загрузка/удаление фото, реордер), `services`,
  `advantages`, `team`
- `PATCH /api/admin/settings`
- `GET/PATCH/DELETE /api/admin/reviews` — approve/reject/hide/edit/delete
- `GET/PATCH /api/admin/leads` — список + отметка "обработано"
- `POST /api/admin/uploads` — приём файла, обработка через `sharp`
  (resize + webp), сохранение в volume, возврат URL

### Telegram-бот (grammY, внутри backend-процесса)

- `/start` → сохраняет `chatId` в `TelegramSubscriber`, подтверждение
- При создании `Review` или `Lead` — рассылка сообщения всем
  подписчикам. Отправка — best-effort (try/catch + лог), не
  блокирует создание записи при недоступности Telegram API.

## 7. Админ-панель (Vue 3 SPA)

Один аккаунт админа (логин/пароль, JWT в localStorage, роут-гард на
401 → редирект на `/login`).

Разделы: Дашборд (счётчики новых заявок / отзывов на модерации) →
Объекты (список + редактор, загрузка фото, drag-and-drop сортировка)
→ Услуги / Преимущества / Команда (простые CRUD-списки) → Отзывы
(очередь модерации + список опубликованных) → Заявки (инбокс) →
Настройки (тексты хиро, инфо о компании, контакты, статистика).

## 8. Публичный сайт (Nuxt)

### Страницы

- `/` — Header, Hero (асимметричный сплит 55/45, статкарточки,
  floating pills, CTA "Рассчитать стоимость"), грид "Наши объекты"
  (featured), краткий блок "О компании", "Наши услуги", "Почему
  выбирают нас", 2–3 последних отзыва, контакты в футере
- `/about` — история/опыт/направления (`SiteSettings`), команда
- `/objects` — полный грид объектов
- `/objects/:slug` — отдельная страница объекта: галерея (лайтбокс),
  описание, год, CTA "Оставить заявку"
- `/reviews` — список одобренных отзывов + кнопка "Оставить отзыв" →
  форма (имя, оценка, текст, фото, чекбокс согласия на обработку
  ПДн) → `POST /api/reviews`
- `/contacts` — телефон, e-mail, режим работы, ссылка ВК, форма заявки
- `/privacy` — статичная страница политики обработки персональных
  данных (юридически обязательна из-за форм со сбором ПДн — 152-ФЗ)

### Компоненты

`Header`, `Footer`, `HeroSection`, `StatCard`, `FloatingPillControl`,
`ObjectCard`, `ObjectGallery`, `ServiceCard`, `AdvantageItem`,
`ReviewCard`, `ReviewForm`, `LeadFormModal` (глобальная форма заявки).

### Форма заявки

Поля: имя, телефон, комментарий (необязательно) + чекбокс согласия на
обработку ПДн со ссылкой на `/privacy`.

### SEO-база (без блога)

`@nuxtjs/sitemap`, `robots.txt`, per-page meta (`useSeoMeta`),
человекочитаемые `slug` для объектов — задел на будущий блог/SEO без
переделки структуры.

### Изображения

Обработка (resize + webp) происходит на backend при загрузке в
админке; фронт получает уже оптимизированные ссылки, использует
`loading="lazy"`.

## 9. Обработка ошибок

- Backend: единый exception filter (общий JSON-формат ошибок),
  `ValidationPipe` + `class-validator` на все DTO, валидация
  загружаемых файлов (тип/размер)
- Telegram-уведомления не блокируют создание заявки/отзыва при сбое
- Admin SPA: 401 → редирект на логин, инлайн-ошибки форм, тосты для
  ошибок API

## 10. Тестирование

- Backend: unit-тесты на сервисы (Jest), e2e на критичные эндпоинты
  (приём заявки/отзыва, логин админа, guard на `/api/admin/*`)
- Frontend: без объёмного покрытия в MVP; визуальная приёмка по
  чек-листу DESIGN_SYSTEM.md §25
- CI-прогон тестов — вне скоупа MVP, можно добавить позже

## 11. Следующий этап (вне этой спеки, отдельный шаг)

После утверждения имплементационного плана — наполнение сайта:

- Реальные тексты (о компании, услуги, преимущества, история)
- Seed-скрипт (Prisma) с демо-данными: `SiteSettings` с уже
  известными реальными контактами (`+7 (911) 144-43-15`,
  `79111444315@yandex.ru`, режим пн-пт 9:00–19:00, сб 9:00–15:00,
  ссылка на группу ВК `https://m.vk.ru/club229134840`), черновой
  список услуг/преимуществ по категориям из ТЗ, несколько примеров
  объектов и отзывов
- Открытый вопрос на будущее: реальных фото объектов пока нет —
  вариант с плейсхолдер-изображениями для моков решается отдельно,
  когда дойдём до этого шага

## 12. Зафиксированные решения из уточняющих вопросов

- Бэкенд: NestJS (не Python)
- Бот: Telegram, только push-уведомления (без модерации кнопками)
- Хостинг: свой VPS, Docker
- Репозиторий: monorepo
- Страница объекта: отдельная страница (не лайтбокс на грид-странице)
- Админка: один аккаунт (без ролей/нескольких пользователей)
- Хранение фото: диск сервера + Nginx
- Полнота ТЗ: недостающие пункты (услуги/преимущества/контакты/заявки
  в разделе 10 ТЗ) заполнены по разумному умолчанию; позже пользователь
  прислал полный текст ТЗ — он учтён в этой спеке (раздел
  "Административная панель" целиком, требования к фото, адаптивность,
  реальные контакты)
- Форма заявки: имя + телефон + комментарий (без выбора типа услуги)
