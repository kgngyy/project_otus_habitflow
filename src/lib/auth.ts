import { supabase } from './supabase';
import { logger } from './logger';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  logger.info('user_signed_up', { email });
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logger.error('signin_failed', { message: error.message });
    throw new Error(error.message);
  }
  logger.info('user_signed_in', { email });
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  logger.info('user_signed_out');
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

export function onAuthChange(
  cb: (session: import('@supabase/supabase-js').Session | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
