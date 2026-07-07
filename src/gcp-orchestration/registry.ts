import type { ModelRegistryEntry } from './types';

const registry = new Map<string, ModelRegistryEntry[]>();

export function registerCandidate(entry: ModelRegistryEntry): void {
  const list = registry.get(entry.modelId) ?? [];
  list.push(entry);
  registry.set(entry.modelId, list);
}

export function promoteModel(modelId: string, version: string): ModelRegistryEntry {
  const list = registry.get(modelId) ?? [];
  const candidate = list.find((entry) => entry.version === version);
  if (!candidate) {
    throw new Error(`Candidate model ${modelId}:${version} not found`);
  }

  for (const entry of list) {
    if (entry.status === 'production') {
      entry.status = 'staging';
    }
  }

  candidate.status = 'production';
  return candidate;
}

export function rollbackModel(modelId: string, previousVersion: string): ModelRegistryEntry {
  const list = registry.get(modelId) ?? [];
  const previous = list.find((entry) => entry.version === previousVersion);
  if (!previous) {
    throw new Error(`Rollback target ${modelId}:${previousVersion} not found`);
  }

  for (const entry of list) {
    if (entry.status === 'production') {
      entry.status = 'rolled_back';
    }
  }

  previous.status = 'production';
  return previous;
}

export function getRegistry(modelId: string): ModelRegistryEntry[] {
  return [...(registry.get(modelId) ?? [])];
}

export function resetRegistry(): void {
  registry.clear();
}
