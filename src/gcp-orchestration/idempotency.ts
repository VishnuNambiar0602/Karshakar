import { createHash } from 'node:crypto';

const processedKeys = new Set<string>();

export function createIdempotencyKey(parts: {
  jobId: string;
  stage: string;
  datasetVersion: string;
  requestId: string;
}): string {
  const payload = `${parts.jobId}|${parts.stage}|${parts.datasetVersion}|${parts.requestId}`;
  return createHash('sha256').update(payload).digest('hex');
}

export function isDuplicateRequest(key: string): boolean {
  return processedKeys.has(key);
}

export function markRequestProcessed(key: string): void {
  processedKeys.add(key);
}

export function resetIdempotencyState(): void {
  processedKeys.clear();
}
