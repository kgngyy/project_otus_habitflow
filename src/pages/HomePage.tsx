import { useEffect, useState } from 'react';
import type { Habit } from '../types';
import {
  fetchHabits,
  createHabit,
  updateHabit,
  toggleCheckIn,
  deleteHabit,
} from '../lib/api';
import { analytics } from '../lib/analytics';
import { todayKey, isScheduledToday } from '../storage';
import HabitList from '../components/HabitList';
import HabitForm from '../components/HabitForm';
import ProgressBar from '../components/ProgressBar';

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Habit | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setHabits(await fetchHabits());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitHabit = async (data: {
    id?: string;
    name: string;
    color: string;
    days: number[];
  }) => {
    try {
      if (data.id) {
        await updateHabit(data.id, {
          name: data.name,
          color: data.color,
          days: data.days,
        });
        setEditing(null);
      } else {
        await createHabit({ name: data.name, color: data.color, days: data.days });
        analytics.habitCreated();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить привычку');
    }
  };

  const startEdit = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit) setEditing(habit);
  };

  const toggle = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const key = todayKey();
    const checked = habit.history.includes(key);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              history: checked
                ? h.history.filter((d) => d !== key)
                : [...h.history, key],
            }
          : h,
      ),
    );
    try {
      await toggleCheckIn(id, key, checked);
      if (!checked) analytics.checkIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения отметки');
      load();
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить привычку и всю её историю?')) return;
    try {
      await deleteHabit(id);
      analytics.habitDeleted();
      setHabits((prev) => prev.filter((h) => h.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить привычку');
    }
  };

  if (loading) return <p className="empty-state">Загрузка…</p>;

  const today = habits.filter((h) => isScheduledToday(h));
  const doneToday = today.filter((h) => h.history.includes(todayKey()));
  const progress = today.length === 0 ? 0 : (doneToday.length / today.length) * 100;

  return (
    <div className="page">
      <header className="header">
        <h1>HabitFlow</h1>
        <p className="header__subtitle">
          Сегодня выполнено: {doneToday.length} из {today.length}
        </p>
        <ProgressBar value={progress} />
      </header>

      {error && <p className="habit-form__error" role="alert">{error}</p>}

      <HabitForm
        onSubmit={submitHabit}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
      />

      <section>
        <h2>Мои привычки</h2>
        <HabitList
          habits={habits}
          onToggle={toggle}
          onDelete={remove}
          onEdit={startEdit}
        />
      </section>
    </div>
  );
}
