import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Habit } from '../types';
import { fetchHabits } from '../lib/api';
import { toDateKey } from '../storage';

const WEEK_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function StatsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHabits()
      .then(setHabits)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-state">Загрузка…</p>;

  const days: { key: string; label: string; done: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const scheduled = habits.filter((h) => h.days.includes(d.getDay()));
    const done = scheduled.filter((h) => h.history.includes(key));
    days.push({
      key,
      label: WEEK_LABELS[(d.getDay() + 6) % 7],
      done: done.length,
      total: scheduled.length,
    });
  }

  const totalDone = days.reduce((s, d) => s + d.done, 0);
  const totalScheduled = days.reduce((s, d) => s + d.total, 0);
  const overall = totalScheduled === 0 ? 0 : Math.round((totalDone / totalScheduled) * 100);

  return (
    <div className="page">
      <header className="header">
        <Link to="/" className="back-link">← Назад</Link>
        <h1>Статистика</h1>
        <p className="header__subtitle">Выполнение за 7 дней: {overall}%</p>
      </header>

      {error && <p className="habit-form__error" role="alert">{error}</p>}

      {totalScheduled === 0 ? (
        <p className="empty-state">Пока нет данных — начните отмечать привычки.</p>
      ) : (
        <div className="stats">
          {days.map((d) => {
            const pct = d.total === 0 ? 0 : Math.round((d.done / d.total) * 100);
            return (
              <div className="stats__bar" key={d.key}>
                <span className="stats__label">{d.label}</span>
                <div className="stats__track">
                  <div className="stats__fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="stats__value">{d.done}/{d.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
