import { AsyncLocalStorage } from 'node:async_hooks';

export type TraceContext = {
  requestId: string;
  userId?: string;
  route?: string;
  ip?: string;
  startedAt: number;
};

const storage = new AsyncLocalStorage<TraceContext>();

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function withTraceContext<T>(context: Omit<TraceContext, 'startedAt'>, fn: () => Promise<T>): Promise<T> {
  return storage.run({ ...context, startedAt: Date.now() }, fn);
}

export function getTraceContext(): TraceContext | undefined {
  return storage.getStore();
}

export function getTraceMeta(): Record<string, unknown> {
  const ctx = getTraceContext();
  if (!ctx) {
    return {};
  }

  return {
    requestId: ctx.requestId,
    userId: ctx.userId,
    route: ctx.route,
    ip: ctx.ip,
    elapsedMs: Date.now() - ctx.startedAt,
  };
}
