import { useEffect, useState, type FormEvent } from 'react';
import type { Habit } from '../types';

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const COLORS = ['#4f8cff', '#ff6b6b', '#6bd08f', '#ffc94d', '#aa5cff', '#ff8a5c'];

interface HabitFormData {
  id?: string;
  name: string;
  color: string;
  days: number[];
}

interface Props {
  onSubmit: (data: HabitFormData) => void | Promise<void>;
  editing?: Habit | null;
  onCancelEdit?: () => void;
}

export default function HabitForm({ onSubmit, editing = null, onCancelEdit }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');

  // При переключении в режим редактирования подставляем значения привычки,
  // при выходе из него — сбрасываем форму в исходное состояние.
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setColor(COLORS.includes(editing.color) ? editing.color : COLORS[0]);
      setDays([...editing.days].sort((a, b) => a - b));
    } else {
      setName('');
      setColor(COLORS[0]);
      setDays([1, 2, 3, 4, 5]);
    }
    setError('');
  }, [editing]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название привычки');
      return;
    }
    if (days.length === 0) {
      setError('Выберите хотя бы один день недели');
      return;
    }
    setError('');
    onSubmit({
      id: editing?.id,
      name: trimmed,
      color,
      days: [...days].sort((a, b) => a - b),
    });
    // В режиме создания очищаем форму сразу (для редактирования её сбросит родитель).
    if (!editing) {
      setName('');
      setColor(COLORS[0]);
      setDays([1, 2, 3, 4, 5]);
    }
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit} noValidate>
      <input
        className="habit-form__input"
        type="text"
        value={name}
        maxLength={100}
        placeholder="Новая привычка"
        aria-label="Название привычки"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="habit-form__colors" role="radiogroup" aria-label="Цвет">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`habit-form__color${c === color ? ' habit-form__color--active' : ''}`}
            style={{ background: c }}
            aria-label={`Цвет ${c}`}
            aria-pressed={c === color}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="habit-form__days" role="group" aria-label="Дни недели">
        {DAY_LABELS.map((label, idx) => (
          <button
            key={idx}
            type="button"
            className={`habit-form__day${days.includes(idx) ? ' habit-form__day--active' : ''}`}
            aria-pressed={days.includes(idx)}
            onClick={() => toggleDay(idx)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="habit-form__error" role="alert">{error}</p>}
      <div className="habit-form__actions">
        <button className="habit-form__submit" type="submit">
          {editing ? 'Сохранить' : 'Добавить'}
        </button>
        {editing && (
          <button className="habit-form__cancel" type="button" onClick={onCancelEdit}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
