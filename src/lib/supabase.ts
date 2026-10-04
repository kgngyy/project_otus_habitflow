import { createClient } from '@supabase/supabase-js';

// URL проекта и anon-ключ не являются секретами (это public client),
// но держим их в переменных окружения Vite, а не в коде.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Скопируйте .env.example в .env и заполните значения.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Токен в localStorage: сессия переживает перезагрузку страницы.
    persistSession: true,
    autoRefreshToken: true,
  },
});
