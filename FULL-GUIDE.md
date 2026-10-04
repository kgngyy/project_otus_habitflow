# Полный гайд: как сделать и сдать итоговый проект (пошагово)

> Этот документ для тех, кто «совершенно не понимает, что делать».
> Читайте по порядку, повторяйте каждый шаг. Срок — 7 недель (можно уложиться быстрее).

---

## 0. Что мы строим

**HabitFlow** — трекер привычек: вы регистрируетесь, добавляете привычки
(«Читать 20 минут», «Бегать»), отмечаете выполнение каждый день и смотрите статистику за неделю.

Это полноценное fullstack-приложение, которое покрывает **все** требования ТЗ:
- ✅ Frontend: React + TypeScript + Vite (3 экрана: Вход, Главная, Статистика)
- ✅ Backend: Supabase (PostgreSQL + Auth + RLS + автогенерируемый REST API)
- ✅ БД: 3 связанные таблицы (`profiles` → `habits` → `check_ins`)
- ✅ CRUD, аутентификация, валидация
- ✅ 2+ интеграции: OAuth2 (Google/Яндекс) + аналитика (Яндекс.Метрика) + логирование
- ✅ Деплой: Netlify, CI/CD: GitHub Actions, мониторинг: health-check + UptimeRobot
- ✅ AI на всех этапах + документация процесса

---

## 1. Что нужно установить (один раз)

1. **Node.js** (22+, лучше 24 LTS) — https://nodejs.org
   Проверка: `node -v` → должно быть `v22.22.2` или выше.
2. **Git** — https://git-scm.com
   Проверка: `git --version`
3. **VS Code** — https://code.visualstudio.com (удобный редактор)
4. Аккаунты (бесплатные): GitHub, Supabase, Netlify, Google Cloud (для OAuth),
   Яндекс.Метрика.

---

## 2. Запуск проекта локально (чтобы увидеть, что он работает)

В VS Code откройте терминал (`Ctrl + ~`) в папке `habitflow-final` и выполните:

```bash
npm install
```

Затем скопируйте настройки окружения:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Пока можно оставить `.env` пустым — приложение загрузится, но без бэкенда
данные сохраняться не будут. Чтобы всё заработало, нужно выполнить шаг 3.

Проверка, что код валиден:

```bash
npm run lint && npm test && npm run build
```

→ 0 ошибок, 13 тестов прошло, собралась папка `dist`. Это значит, код рабочий.

---

## 3. Подключаем базу данных и бэкенд (Supabase)

Supabase — это готовый бэкенд: база PostgreSQL + авторизация + REST API «из коробки».
Вам не нужно писать серверный код — только залить SQL-схему.

1. Зайдите на https://supabase.com → **Sign up** (можно через GitHub).
2. **New project** → задайте имя, пароль БД (запомните!), регион можно оставить.
3. Дождитесь создания (1–2 минуты).
4. В левом меню **SQL Editor** → **New query**.
5. Откройте файл `001_init.sql` из проекта, скопируйте ВСЁ содержимое, вставьте
   в редактор и нажмите **Run**. Это создаст таблицы и политики безопасности.
   (Опционально так же выполните `002_logs.sql` — таблица для логов.)
6. **Project Settings → API** → скопируйте:
   - `Project URL` → вставьте в `.env` как `VITE_SUPABASE_URL`
   - `anon public` key → вставьте как `VITE_SUPABASE_ANON_KEY`

Пример заполненного `.env`:
```
VITE_SUPABASE_URL=https://abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Теперь перезапустите dev-сервер:
```bash
npm run dev
```
Откройте http://localhost:5173 — можно регистрироваться и добавлять привычки.
Данные будут реально сохраняться в вашу базу.

---

## 4. Включаем вход через Google (OAuth2) — одна из обязательных интеграций

1. Зайдите в https://console.cloud.google.com → создайте новый проект.
2. **APIs & Services → OAuth consent screen** → выберите **External** → заполните
   обязательные поля → **Save**.
3. **Credentials → Create Credentials → OAuth client ID** → тип **Web application**.
4. В поле **Authorized redirect URIs** вставьте:
   `https://<ваш-project-ref>.supabase.co/auth/v1/callback`
   (Project URL берётся из Supabase Settings → API).
5. Скопируйте **Client ID** и **Client secret**.
6. Вернитесь в Supabase → **Authentication → Providers → Google**:
   включите и вставьте Client ID / secret → **Save**.

Теперь кнопка «Продолжить с Google» на странице входа будет работать.

*(Яндекс ID настраивается аналогично, но как кастомный OIDC-провайдер с
Provider ID = `yandex` — подробности в `integration_documentation.md`, раздел 2.2.
Для минимальной сдачи достаточно Google.)*

---

## 5. Включаем аналитику (Яндекс.Метрика) — вторая интеграция

1. Зайдите на https://metrika.yandex.ru → **Добавить счётчик**.
2. Запишите номер счётчика (например, `113375340`).
3. В файле `index.html` замените номер `113375340` на свой (2 места).
4. В `.env` укажите `VITE_YM_COUNTER_ID=ваш-номер`.

Теперь события (создание привычки, отметка, вход) будут уходить в Метрику.

---

## 6. Публикуем код на GitHub

1. Создайте на GitHub новый **пустой** репозиторий (не добавляйте README при создании!).
   Название, например, `habitflow`.
2. В терминале в папке проекта:

```bash
git init
git add .
git commit -m "HabitFlow: итоговый проект"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/habitflow.git
git push -u origin main
```

3. Добавьте секреты (нужны для CI/CD):
   GitHub → репозиторий → **Settings → Secrets and variables → Actions → New repository secret**.
   Создайте секреты:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_YM_COUNTER_ID` (необязательно)
   - `NETLIFY_AUTH_TOKEN` (получите в шаге 7)
   - `NETLIFY_SITE_ID` (получите в шаге 7)

---

## 7. Деплой на Netlify

1. Зайдите на https://app.netlify.com → **Sign up** (через GitHub).
2. **Add new site → Import an existing project → GitHub** → выберите `habitflow`.
3. Настройки сборки уже заданы в `netlify.toml`, Netlify подхватит их сам.
4. Запишите:
   - **Site ID**: Netlify → Site settings → General → Site ID.
   - **Access token**: Netlify → User settings → Applications → Personal access tokens → New.
5. Вставьте эти два значения в секреты GitHub (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`).
6. Снова сделайте пуш (или пуш в `main`) → GitHub Actions соберёт и задеплоит проект.

Ваш сайт будет доступен по адресу вида `https://<имя>.netlify.app`.

---

## 8. Финальный чек-лист перед сдачей

- [ ] `npm run lint && npm test && npm run build` — без ошибок
- [ ] Приложение задеплоено и открывается по ссылке
- [ ] Регистрация и вход работают (email и Google)
- [ ] Привычки создаются, редактируются, удаляются, отмечаются
- [ ] Статистика за 7 дней считается
- [ ] CI/CD зелёный (Actions без ошибок)
- [ ] OAuth2 работает
- [ ] Метрика видит посетителя
- [ ] README.md заполнен (идея, функциональность, технологии, инструкции, скриншоты)
- [ ] Документация процесса с AI заполнена (`ai-process.md`)
- [ ] Нет критических багов

---

## 9. Как отвечать на защите (короткие подсказки)

- **Идея:** трекер привычек — простой продукт, который покрывает все требования ТЗ.
- **Стек:** React + TS + Vite (фронт), Supabase (PostgreSQL + Auth + RLS + PostgREST) (бэк),
  Netlify + GitHub Actions (деплой/CI-CD), Яндекс.Метрика (аналитика).
- **Безопасность:** RLS (каждый видит только свои данные), `.env` в `.gitignore`,
  JWT-аутентификация, `npm audit` = 0 уязвимостей.
- **AI:** использовался на каждом этапе (идея → UI → БД → код → тесты → CI/CD → отладка),
  всё задокументировано в `ai-process.md`.

---
*Успехов!*
