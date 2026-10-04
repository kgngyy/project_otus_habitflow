type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  context?: Record<string, unknown>;
  url?: string;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10, info: 20, warn: 30, error: 40,
};

const MIN_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') console.error(line);
  else if (entry.level === 'warn') console.warn(line);
  else console.log(line);
}

function log(level: LogLevel, msg: string, context?: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;
  emit({
    ts: new Date().toISOString(),
    level, msg, context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log('debug', m, c),
  info: (m: string, c?: Record<string, unknown>) => log('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => log('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => log('error', m, c),
};
