# HabitFlow — отчёт по аудиту безопасности (ДЗ 6)

> Дата: 03.10.2026
> Метод: `npm audit` + ручной/AI-анализ кода и схемы БД по OWASP Top 10.

## 1. Итог

| Категория | Результат |
|-----------|-----------|
| Уязвимые зависимости (`npm audit`) | **0 уязвимостей** |
| XSS | Не обнаружено (React экранирует вывод) |
| CSRF | Риск низкий (JWT в заголовке, не cookie) |
| SQL Injection | Не обнаружено (PostgREST, без сырого SQL) |
| Утечка секретов | Не обнаружено (anon-ключ в `.env`, `.env` в `.gitignore`) |
| Авторизация / IDOR | Закрыто RLS (`auth.uid()`) |
| Хранение токена | Приемлемо для ДЗ (localStorage), см. рекомендации |

**Общий статус: PASS** (критических уязвимостей нет).

## 2. Аудит зависимостей

```bash
$ npm audit
found 0 vulnerabilities
```

```json
{ "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 } }
```

> В CI добавлен шаг `npm audit --audit-level=high`.

## 3. Анализ по OWASP Top 10 (2021)

- **A01 Broken Access Control** → ✅ RLS на всех таблицах, `auth.uid() = user_id`, для `check_ins` — `exists` по `habits`.
- **A02 Cryptographic Failures** → ✅ bcrypt + HTTPS (Supabase).
- **A03 Injection** → ✅ PostgREST параметризует запросы; в SQL нет динамической конкатенации пользовательского ввода.
- **A04 Insecure Design** → ✅ минимальные права (`revoke all ... from anon`), `with check`, триггер `security definer` + `set search_path=''`.
- **A05 Security Misconfiguration** → ✅ `.env` в `.gitignore`, `service_role` не используется.
- **A06 Vulnerable Components** → ✅ `npm audit` = 0; контроль в CI.
- **A07 Auth Failures** → ✅ подтверждение e-mail, JWT, `autoRefreshToken`.
- **A08 Data Integrity** → ✅ `npm ci` (установка по lock-файлу).
- **A09 Logging/Monitoring** → ✅ JSON-логи + health-check (ДЗ 6).
- **A10 SSRF** → ✅ не применимо (нет серверных запросов по пользовательским URL).

## 4. Специфические риски

1. **JWT в localStorage** — риск XSS-кражи. Принят для учебного проекта; рекомендация: HttpOnly cookie для прода.
2. **XSS через `dangerouslySetInnerHTML`** — в коде отсутствует; вывод через React (автоэкранирование).
3. **CSRF** — низкий риск (аутентификация через заголовок `Authorization: Bearer`).

## 5. Найденные уязвимости и исправления

| # | Уязвимость | Серьёзность | Статус | Действие |
|---|-----------|-------------|--------|----------|
| 1 | Уязвимые зависимости | — | ✅ не найдено | `npm audit` = 0; контроль в CI |
| 2 | XSS через `dangerouslySetInnerHTML` | низкая | ✅ не применимо | в коде отсутствует |
| 3 | JWT в localStorage | средняя (теор.) | ⚠️ принят | задокументирован; рекомендация — HttpOnly cookie |

## 6. Рекомендации (для продакшена)

CSP, `force row level security`, ограничение домена OAuth (для Google/Yandex — только нужные redirect URI), Dependabot, алерты по `level=error`, rate limiting.

## 7. Как воспроизвести

```bash
npm audit --json
npm run lint
grep -RInE "(password|secret|api[_-]?key|token)" src --exclude-dir=node_modules
```

---
*Аудит выполнен с использованием AI-ассистента; выводы проверены вручную.*
