# HabitFlow — трекер привычек

Fullstack-приложение: **React + TypeScript + Vite** на фронтенде и **Supabase**
(PostgreSQL + Auth + RLS) на бэкенде.

## Возможности
- Регистрация и вход (Supabase Auth, подтверждение email).
- **Вход через Google (OAuth2) и Яндекс ID (OAuth2/OIDC)** — ДЗ 6.
- Создание / редактирование / удаление привычек.
- Отметка выполнения «на сегодня», статистика за 7 дней.
- Row Level Security: каждый пользователь видит только свои данные.
- **Аналитика (Яндекс.Метрика, счётчик 113375340)** и **структурированное логирование** — ДЗ 6.

## Технологии
- Frontend: React 19, TypeScript, Vite, React Router, Vitest + Testing Library.
- Backend: Supabase (PostgreSQL 15+, PostgREST REST API, Auth, RLS).
- DevOps: GitHub Actions (CI/CD), Netlify (деплой), UptimeRobot (мониторинг).

## Структура
```
habitflow/
├── .github/workflows/ci-cd.yml  # CI/CD (lint→test→build→audit→deploy)
├── 001_init.sql                 # миграция БД
├── 002_logs.sql                 # таблица app_logs (логи, опц.)
├── netlify.toml                 # конфиг деплоя
├── integration_documentation.md # документация по интеграциям (ДЗ 6)
├── security_audit.md            # отчёт по аудиту безопасности (ДЗ 6)
├── backend_documentation.md     # архитектура, API, развёртывание
├── supabase/functions/health/   # health-check (Edge Function)
├── .env.example
├── public/health.json           # health-check (liveness)
└── src/
    ├── lib/                     # supabase, auth, oauth, api, analytics, logger
    ├── components/              # HabitForm, HabitList, ProgressBar
    └── pages/                   # HomePage, StatsPage, LoginPage
```

## Требования
- Node.js >= 22.22.2 (рекомендуется 24 LTS). См. `.nvmrc`.

## Быстрый старт
```bash
cd habitflow
npm install
cp .env.example .env        # Windows: copy .env.example .env
# заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

## Скрипты
- `npm run dev` — dev-сервер Vite.
- `npm run build` — production-сборка (tsc + vite build).
- `npm run test` — тесты (Vitest).
- `npm run lint` — линтер (Oxlint).

## CI/CD
Pipeline в `.github/workflows/ci-cd.yml`: lint → test → build → `npm audit` → деплой на Netlify (при пуше в `main`).

## Документация
- Интеграции — [integration_documentation.md](integration_documentation.md).
- Аудит безопасности — [security_audit.md](security_audit.md).
- Backend и API — [backend_documentation.md](backend_documentation.md). 
