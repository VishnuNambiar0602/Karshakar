import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ExperimentRun, TrainingConfig, UNetConfig } from './types';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

export function hashRunConfig(modelConfig: UNetConfig, trainingConfig: TrainingConfig): string {
  const payload = stableStringify({ modelConfig, trainingConfig });
  return createHash('sha256').update(payload).digest('hex');
}

export async function appendExperimentRun(filePath: string, run: ExperimentRun): Promise<void> {
  const existing = await loadExperimentRuns(filePath);
  existing.push(run);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
}

export async function loadExperimentRuns(filePath: string): Promise<ExperimentRun[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as ExperimentRun[];
  } catch {
    return [];
  }
}
