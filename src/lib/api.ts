import { supabase } from './supabase';
import type { Habit } from '../types';

/* ------------------------------- строки БД ------------------------------- */
interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  days: number[];
  created_at: string;
}

interface CheckInRow {
  habit_id: string;
  date_key: string;
}

/* -------------------------------- ошибки -------------------------------- */
export class AppError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/** Человекочитаемые тексты для типовых кодов Postgres / PostgREST. */
const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Такая запись уже существует',
  '23503': 'Связанная запись не найдена',
  '23514': 'Данные не прошли проверку ограничений',
  '42501': 'Недостаточно прав: доступ к чужой записи запрещён',
  'PGRST116': 'Запись не найдена или недоступна',
  'PGRST301': 'Сессия истекла — войдите заново',
};

function toAppError(error: { message: string; code?: string }): AppError {
  const known = error.code ? ERROR_MESSAGES[error.code] : undefined;
  return new AppError(known ?? error.message, error.code);
}

/* ------------------------------ хелперы ---------------------------------- */
/** PostgREST по умолчанию отдаёт максимум 1000 строк на запрос. */
const PAGE_SIZE = 1000;

/* --------------------------------- READ ---------------------------------- */
export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, color, days, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw toAppError(error);

  const rows = (data ?? []) as HabitRow[];
  if (rows.length === 0) return [];

  // тянем отметки ТОЛЬКО своих привычек, а не весь свой check_ins
  const { data: checkIns, error: ciError } = await supabase
    .from('check_ins')
    .select('habit_id, date_key')
    .in('habit_id', rows.map((r) => r.id));

  if (ciError) throw toAppError(ciError);

  const history = new Map<string, string[]>();
  for (const { habit_id, date_key } of (checkIns ?? []) as CheckInRow[]) {
    const list = history.get(habit_id);
    if (list) list.push(date_key);
    else history.set(habit_id, [date_key]);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    days: r.days,
    history: (history.get(r.id) ?? []).sort(),
    createdAt: r.created_at,
  }));
}

/* -------------------------------- CREATE ---------------------------------- */
export async function createHabit(data: {
  name: string;
  color: string;
  days: number[];
}): Promise<Habit> {
  const { data: habit, error } = await supabase
    .from('habits')
    .insert({
      name: data.name.trim(),
      color: data.color,
      days: data.days,
      // user_id НЕ передаём: его подставит default auth.uid(), RLS проверит
    })
    .select('id, name, color, days, created_at')
    .single();

  if (error) throw toAppError(error);

  return {
    id: habit.id,
    name: habit.name,
    color: habit.color,
    days: habit.days,
    history: [],
    createdAt: habit.created_at,
  };
}

/* -------------------------------- UPDATE ---------------------------------- */
export async function updateHabit(
  id: string,
  patch: Partial<{ name: string; color: string; days: number[] }>,
): Promise<void> {
  const { error } = await supabase.from('habits').update(patch).eq('id', id);
  if (error) throw toAppError(error);
}

/* ------------------------- отметки: add / remove --------------------------- */
export async function addCheckIn(habitId: string, dateKey: string): Promise<void> {
  const { error } = await supabase
    .from('check_ins')
    .insert({ habit_id: habitId, date_key: dateKey });
  // 23505 == отметка уже стоит → считаем операцию идемпотентной
  if (error && error.code !== '23505') throw toAppError(error);
}

export async function removeCheckIn(habitId: string, dateKey: string): Promise<void> {
  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('habit_id', habitId)
    .eq('date_key', dateKey);
  if (error) throw toAppError(error);
}

/**
 * Переключает отметку.
 * @param currentlyChecked — стоит ли отметка СЕЙЧАС (как в HomePage.tsx)
 */
export async function toggleCheckIn(
  habitId: string,
  dateKey: string,
  currentlyChecked: boolean,
): Promise<void> {
  return currentlyChecked
    ? removeCheckIn(habitId, dateKey)
    : addCheckIn(habitId, dateKey);
}

/* -------------------------------- DELETE ---------------------------------- */
export async function deleteHabit(id: string): Promise<void> {
  // check_ins удалятся каскадно (on delete cascade)
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw toAppError(error);
}
