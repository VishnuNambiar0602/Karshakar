import 'server-only';

type JobFn<T> = () => Promise<T>;

type QueuedJob<T> = {
  run: JobFn<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

const QUEUE_CONCURRENCY = Number(process.env.JOB_QUEUE_CONCURRENCY || 2);
const queue: QueuedJob<unknown>[] = [];
let active = 0;

function drainQueue(): void {
  while (active < QUEUE_CONCURRENCY && queue.length > 0) {
    const next = queue.shift();
    if (!next) {
      return;
    }

    active++;
    next
      .run()
      .then(next.resolve)
      .catch(next.reject)
      .finally(() => {
        active--;
        drainQueue();
      });
  }
}

export function enqueueJob<T>(run: JobFn<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ run, resolve, reject } as QueuedJob<unknown>);
    drainQueue();
  });
}

export function queueDepth(): number {
  return queue.length;
}
