import type { Habit } from '../types';
import { todayKey, isScheduledToday } from '../storage';

interface Props {
  habits: Habit[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function HabitList({ habits, onToggle, onDelete, onEdit }: Props) {
  if (habits.length === 0) {
    return <p className="empty-state">Пока нет привычек — добавьте первую.</p>;
  }

  const today = todayKey();

  return (
    <ul className="habit-list">
      {habits.map((h) => {
        const checked = h.history.includes(today);
        const scheduled = isScheduledToday(h);
        return (
          <li className="habit-item" key={h.id}>
            <button
              type="button"
              className={`habit-item__check${checked ? ' habit-item__check--done' : ''}`}
              style={{
                borderColor: h.color,
                background: checked ? h.color : 'transparent',
              }}
              aria-label={`Отметить привычку ${h.name}`}
              aria-pressed={checked}
              disabled={!scheduled}
              onClick={() => onToggle(h.id)}
            >
              {checked ? '✓' : ''}
            </button>
            <div className="habit-item__body">
              <span className="habit-item__name">{h.name}</span>
              {!scheduled && <small className="habit-item__hint">Не сегодня</small>}
            </div>
            <button
              type="button"
              className="habit-item__edit"
              aria-label={`Редактировать привычку ${h.name}`}
              onClick={() => onEdit(h.id)}
            >
              ✎
            </button>
            <button
              type="button"
              className="habit-item__delete"
              aria-label={`Удалить привычку ${h.name}`}
              onClick={() => onDelete(h.id)}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
