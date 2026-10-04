import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from './supabase';
import {
  fetchHabits, createHabit, addCheckIn, removeCheckIn, deleteHabit, AppError,
} from './api';

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'in', 'eq', 'insert', 'update', 'delete']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  // oxlint-disable-next-line unicorn/no-thenable -- мок цепочки Supabase: объект должен быть awaitable
  builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('fetchHabits', () => {
  it('мапит строки БД в Habit и группирует историю по habit_id', async () => {
    fromMock
      .mockReturnValueOnce(makeBuilder({
        data: [{ id: 'h1', user_id: 'u1', name: 'Чтение', color: '#4f8cff',
                 days: [1, 2], created_at: '2026-09-01T10:00:00Z' }],
        error: null,
      }))
      .mockReturnValueOnce(makeBuilder({
        data: [{ habit_id: 'h1', date_key: '2026-09-20' },
               { habit_id: 'h1', date_key: '2026-09-18' }],
        error: null,
      }));

    const habits = await fetchHabits();

    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({ id: 'h1', name: 'Чтение', days: [1, 2] });
    expect(habits[0].history).toEqual(['2026-09-18', '2026-09-20']);
  });

  it('не делает второй запрос, если привычек нет', async () => {
    fromMock.mockReturnValueOnce(makeBuilder({ data: [], error: null }));
    await expect(fetchHabits()).resolves.toEqual([]);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it('пробрасывает ошибку с человекочитаемым текстом', async () => {
    fromMock.mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'denied', code: '42501' } }));
    await expect(fetchHabits()).rejects.toThrow('Недостаточно прав');
  });
});

describe('createHabit', () => {
  it('не передаёт user_id — его подставляет default auth.uid()', async () => {
    const builder = makeBuilder({
      data: { id: 'h9', name: 'Бег', color: '#fff000', days: [1], created_at: '2026-09-27T06:00:00Z' },
      error: null,
    });
    fromMock.mockReturnValueOnce(builder);

    const habit = await createHabit({ name: '  Бег  ', color: '#fff000', days: [1] });

    expect(builder.insert).toHaveBeenCalledWith({ name: 'Бег', color: '#fff000', days: [1] });
    expect(habit).toMatchObject({ id: 'h9', name: 'Бег', history: [] });
  });
});

describe('check-ins', () => {
  it('addCheckIn глотает 23505 (отметка уже стоит)', async () => {
    fromMock.mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'dup', code: '23505' } }));
    await expect(addCheckIn('h1', '2026-09-27')).resolves.toBeUndefined();
  });

  it('addCheckIn пробрасывает прочие ошибки', async () => {
    fromMock.mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'rls', code: '42501' } }));
    await expect(addCheckIn('h1', '2026-09-27')).rejects.toBeInstanceOf(AppError);
  });

  it('removeCheckIn фильтрует по habit_id и date_key', async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockReturnValueOnce(builder);
    await removeCheckIn('h1', '2026-09-27');
    expect(builder.eq).toHaveBeenCalledWith('habit_id', 'h1');
    expect(builder.eq).toHaveBeenCalledWith('date_key', '2026-09-27');
  });
});

describe('deleteHabit', () => {
  it('строит delete().eq(id)', async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockReturnValueOnce(builder);
    await deleteHabit('h1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'h1');
  });
});
