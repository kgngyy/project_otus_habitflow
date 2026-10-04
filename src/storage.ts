// Утилиты работы с датами (совместимо с БД: date_key = 'YYYY-MM-DD').
import type { Habit } from './types';

/** Преобразует Date в строковый ключ даты 'YYYY-MM-DD'. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ключ сегодняшней даты в локальном часовом поясе. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Запланирована ли привычка на сегодня (день недели по getDay()). */
export function isScheduledToday(habit: Habit): boolean {
  return habit.days.includes(new Date().getDay());
}
