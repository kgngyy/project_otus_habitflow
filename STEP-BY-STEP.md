# Пошаговая инструкция для ДЗ 6 (HabitFlow)

> Для новичков. Работа в VS Code из России. Каждый шаг — что делать и что должно получиться.

## Часть 0. Подготовка
1. Node.js 22+ (лучше 24 LTS): https://nodejs.org → `node -v`.
2. Git: https://git-scm.com → `git --version`.
3. Откройте `habitflow` в VS Code, в терминале (`Ctrl+~`):
```bash
npm install
npm run lint && npm test && npm run build
```
→ 0 ошибок, 13 тестов, dist собран.

## Часть 1. Supabase
1. https://supabase.com → New project (пароль БД, регион Frankfurt).
2. SQL Editor → вставить `001_init.sql` → Run (опц. `002_logs.sql`).
3. Project Settings → API → скопировать **Project URL** и **anon public** key.
4. Создать `.env` (копия `.env.example`) и вписать значения.

## Часть 2. OAuth2 (Google — основной, Яндекс ID — опционально)

**Google (рекомендуется, работает сразу):**
1. https://console.cloud.google.com → создать проект.
2. APIs & Services → OAuth consent screen (External) → заполнить.
3. Credentials → Create Credentials → OAuth client ID → Web application.
4. Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Supabase → Authentication → Providers → Google → включить, вставить Client ID и secret.
6. В `LoginPage.tsx` кнопка «Продолжить с Google» уже есть (импорт `signInWithGoogle`).

**Яндекс ID (опционально, кастомный OIDC):**
1. https://oauth.yandex.ru → создать приложение (платформа «Веб-сервисы»).
2. Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Providers → Add custom provider:
   Provider ID = `yandex`, вставить Client ID / secret.
4. Кнопка «Продолжить с Яндекс ID» уже есть (импорт `signInWithYandex`).

## Часть 3. Аналитика (Яндекс.Метрика)
1. https://metrika.yandex.ru → добавить счётчик → записать номер.
2. Вставить скрипт в `index.html` (заменить `12345678`).
3. В `.env`: `VITE_YM_COUNTER_ID=номер`.
4. Вызвать `analytics.*` в компонентах.

## Часть 4. GitHub + CI/CD
```bash
git init && git add . && git commit -m "HabitFlow ДЗ6"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/habitflow.git
git push -u origin main
```
Settings → Secrets → Actions → добавить: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.

## Часть 5. Деплой (Netlify)
1. https://app.netlify.com → Import from GitHub → habitflow.
2. Site settings → General → Site ID; User settings → Applications → Access token.
3. Заполнить секреты → push → Actions задеплоит.
4. Добавить URL сайта в Supabase (Site URL, CORS) и в Метрику.

## Часть 6. Мониторинг
1. `https://<site>.netlify.app/health.json` → `{"status":"ok"}`.
2. https://uptimerobot.com → монитор на health.json → алерт на email.
3. (Опц.) `npx supabase functions deploy health --project-ref <ref>`.

## Часть 7. Логи + AI
1. F12 → Console → JSON-логи.
2. Скопировать логи → AI-промпт из `integration_documentation.md` (раздел 6.3).
3. Задокументировать результат.

## Часть 8. Чек-лист
- [ ] lint / test / build — без ошибок
- [ ] npm audit — 0 уязвимостей
- [ ] CI/CD зелёный, деплой работает
- [ ] OAuth2 работает
- [ ] Метрика видит посетителя
- [ ] /health.json = ok
- [ ] UptimeRobot мониторит
- [ ] JSON-логи + AI-анализ задокументированы
- [ ] integration_documentation.md и security_audit.md заполнены

## FAQ
- **`npm ci` падает** → удалить node_modules и package-lock.json, `npm install`, закоммитить lock.
- **`VITE_SUPABASE_URL` при сборке** → не заполнены секреты GitHub.
- **Google-вход** → redirect URI ровно `.../auth/v1/callback`.
- **Яндекс ID-вход** → в Supabase выбран кастомный провайдер с Provider ID `yandex`, а не встроенный Google.
- **Метрика** → скрипт не в index.html / блокировщик рекламы.
- **Netlify** → проверить токен и Site ID.
