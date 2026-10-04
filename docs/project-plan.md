# План выполнения проекта (7 недель)

> Соответствует этапам из ТЗ. Можно сжимать: если идёте по готовому коду,
> реально уложиться в 2–3 недели.

## Неделя 1 — Планирование
- [x] Выбор идеи (HabitFlow — трекер привычек).
- [x] Анализ конкурентов (Habitica, Streaks, Loop Habit Tracker) с помощью AI.
- [x] Генерация UI-концепции (Text-to-UI).
- [x] User Stories и ТЗ (docs/user-stories.md).
- [x] Утверждение темы.

## Неделя 2 — Дизайн и архитектура
- [x] Финальная UI-концепция (docs/ui-concept.md).
- [x] Проектирование БД (001_init.sql), API (PostgREST endpoints), ТЗ.

## Недели 3–4 — Frontend
- [x] Инициализация проекта (Vite + React + TS).
- [x] Компоненты: HabitForm, HabitList, ProgressBar.
- [x] Страницы: LoginPage, HomePage, StatsPage.
- [x] Интеграция с Backend (src/lib/api.ts).
- [x] Тестирование (Vitest) и отладка.

## Недели 5–6 — Backend
- [x] Развёртывание БД (Supabase + 001_init.sql).
- [x] Создание API (PostgREST, CRUD).
- [x] Аутентификация (email + OAuth2 Google/Яндекс).
- [x] Безопасность (RLS, GRANT, .env, npm audit).
- [x] Интеграции: аналитика, логирование, health-check.

## Неделя 7 — Деплой и финализация
- [x] CI/CD (.github/workflows/ci-cd.yml).
- [x] Деплой в продакшн (Netlify).
- [x] Финальное тестирование.
- [x] Документация (README, ai-process.md, backend_documentation.md, security_audit.md).
- [x] Подготовка к защите.

---
*План выполнен. Для «перепрохождения» процесса с нуля см. FULL-GUIDE.md.*
