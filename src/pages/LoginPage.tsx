import { useState, type FormEvent } from 'react';
import { signIn, signUp } from '../lib/auth';
import { signInWithGoogle, signInWithYandex } from '../lib/oauth';
import { analytics } from '../lib/analytics';

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
const MIN_PASSWORD = 6;

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Введите e-mail';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Некорректный e-mail';

    if (!password) next.password = 'Введите пароль';
    else if (mode === 'signup' && password.length < MIN_PASSWORD)
      next.password = `Минимум ${MIN_PASSWORD} символов`;

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGoogleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      analytics.loginGoogle();
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти через Google');
    } finally {
      setBusy(false);
    }
  };

  const handleYandexLogin = async () => {
    setError('');
    setBusy(true);
    try {
      analytics.loginYandex();
      await signInWithYandex();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти через Яндекс ID');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'signin') {
        await signIn(cleanEmail, password);
        analytics.login();
      } else {
        const data = await signUp(cleanEmail, password);
        analytics.signup();
        if (!data.session) {
          setInfo('Готово! Проверьте почту и подтвердите регистрацию.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось выполнить вход';
      if (/Invalid login credentials/i.test(msg)) setError('Неверный e-mail или пароль');
      else if (/User already registered/i.test(msg)) setError('Такой пользователь уже зарегистрирован');
      else if (/Email not confirmed/i.test(msg)) setError('E-mail не подтверждён — проверьте почту');
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setInfo('');
    setFieldErrors({});
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-card__title">HabitFlow</h1>
        <p className="login-card__subtitle">
          {mode === 'signin' ? 'Вход в аккаунт' : 'Регистрация'}
        </p>

        <label className="login-field">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validate}
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={busy}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <small className="login-field__error" role="alert">{fieldErrors.email}</small>
          )}
        </label>

        <label className="login-field">
          <span>Пароль</span>
          <input
            type="password"
            name="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validate}
            aria-invalid={Boolean(fieldErrors.password)}
            disabled={busy}
            placeholder={`Минимум ${MIN_PASSWORD} символов`}
          />
          {fieldErrors.password && (
            <small className="login-field__error" role="alert">{fieldErrors.password}</small>
          )}
        </label>

        {error && <p className="login-card__error" role="alert">{error}</p>}
        {info && <p className="login-card__info" role="status">{info}</p>}

        <button className="login-card__oauth" type="button" onClick={handleGoogleLogin} disabled={busy}>
          Продолжить с Google
        </button>
        <button className="login-card__oauth" type="button" onClick={handleYandexLogin} disabled={busy}>
          Продолжить с Яндекс ID
        </button>
        <button className="login-card__submit" type="submit" disabled={busy}>
          {busy ? 'Подождите…' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button className="login-card__switch" type="button" onClick={switchMode} disabled={busy}>
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </form>
    </div>
  );
}
