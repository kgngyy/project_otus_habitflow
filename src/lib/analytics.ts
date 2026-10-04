declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

const COUNTER_ID = Number(import.meta.env.VITE_YM_COUNTER_ID ?? 0);

export function trackEvent(goal: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.ym || !COUNTER_ID) return;
  if (params) window.ym(COUNTER_ID, 'reachGoal', goal, params);
  else window.ym(COUNTER_ID, 'reachGoal', goal);
}

export function trackPageView() {
  if (typeof window === 'undefined' || !window.ym || !COUNTER_ID) return;
  window.ym(COUNTER_ID, 'hit', window.location.pathname);
}

export const analytics = {
  habitCreated: () => trackEvent('habit_created'),
  habitDeleted: () => trackEvent('habit_deleted'),
  checkIn: () => trackEvent('habit_checkin'),
  login: () => trackEvent('login'),
  signup: () => trackEvent('signup'),
  loginGoogle: () => trackEvent('login_google'),
  loginYandex: () => trackEvent('login_yandex'),
};
