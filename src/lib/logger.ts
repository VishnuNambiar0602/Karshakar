import { getTraceMeta } from '@/lib/trace';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const order: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined) ??
  (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

const currentLevel = order[envLevel] ? envLevel : 'info';

type LogMeta = Record<string, unknown>;

function shouldLog(level: LogLevel): boolean {
  return order[level] >= order[currentLevel];
}

function emit(level: LogLevel, message: string, meta?: LogMeta): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...getTraceMeta(),
    ...(meta ?? {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug(message: string, meta?: LogMeta): void {
    emit('debug', message, meta);
  },
  info(message: string, meta?: LogMeta): void {
    emit('info', message, meta);
  },
  warn(message: string, meta?: LogMeta): void {
    emit('warn', message, meta);
  },
  error(message: string, meta?: LogMeta): void {
    emit('error', message, meta);
  },
};
