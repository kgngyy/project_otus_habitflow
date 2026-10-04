import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Вход через Google (OAuth2) — встроенный провайдер Supabase Auth.
 * Настройка: Supabase → Authentication → Providers → Google.
 */
export async function signInWithGoogle(): Promise<void> {
  logger.info('oauth_start', { provider: 'google' });
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    logger.error('oauth_failed', { provider: 'google', message: error.message });
    throw new Error(error.message);
  }
}

/**
 * Вход через Яндекс ID (OAuth2) — кастомный OIDC-провайдер Supabase.
 * Настройка: Supabase → Authentication → Providers → Add custom provider
 * (Provider ID = `yandex`), в коде используется `custom:yandex`.
 */
export async function signInWithYandex(): Promise<void> {
  logger.info('oauth_start', { provider: 'yandex' });
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'custom:yandex',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    logger.error('oauth_failed', { provider: 'yandex', message: error.message });
    throw new Error(error.message);
  }
}
