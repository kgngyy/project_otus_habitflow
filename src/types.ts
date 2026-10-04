// Общие типы приложения HabitFlow.
// days: дни недели, 0=Вс … 6=Сб (совпадает с JS Date.getDay()).
// history: ключи дат "YYYY-MM-DD", когда привычка была отмечена.
export interface Habit {
  id: string;
  name: string;
  color: string;
  days: number[];
  history: string[];
  createdAt: string;
}
