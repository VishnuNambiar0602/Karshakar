import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { JobCheckpoint } from './types';

export function createInitialCheckpoint(jobId: string): JobCheckpoint {
  return {
    jobId,
    lastChunkIndex: -1,
    processedTiles: 0,
    processedBytes: 0,
    failures: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadCheckpoint(filePath: string, jobId: string): Promise<JobCheckpoint> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const checkpoint = JSON.parse(content) as JobCheckpoint;
    if (checkpoint.jobId !== jobId) {
      return createInitialCheckpoint(jobId);
    }
    return checkpoint;
  } catch {
    return createInitialCheckpoint(jobId);
  }
}

export async function saveCheckpoint(filePath: string, checkpoint: JobCheckpoint): Promise<void> {
  const updated = {
    ...checkpoint,
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
}
