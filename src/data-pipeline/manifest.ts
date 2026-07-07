import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ManifestEntry, SpectralTile } from './types';

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([k, v]) => [k, sortObject(v)]));
  }

  return value;
}

function stableStringify(tile: SpectralTile): string {
  return JSON.stringify(sortObject(tile));
}

export function hashTile(tile: SpectralTile): string {
  return createHash('sha256').update(stableStringify(tile)).digest('hex');
}

export function buildManifestEntry(params: {
  tile: SpectralTile;
  outputUri: string;
  transformVersion: string;
  policyVersion: string;
  bytesProcessed: number;
  cloudCoverageRatio: number;
}): ManifestEntry {
  return {
    inputHash: hashTile(params.tile),
    transformVersion: params.transformVersion,
    policyVersion: params.policyVersion,
    outputUri: params.outputUri,
    tileId: params.tile.metadata.tileId,
    bytesProcessed: params.bytesProcessed,
    cloudCoverageRatio: params.cloudCoverageRatio,
    generatedAt: new Date().toISOString(),
  };
}

export async function appendManifestEntry(filePath: string, entry: ManifestEntry): Promise<void> {
  const existing = await loadManifest(filePath);
  existing.push(entry);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
}

export async function loadManifest(filePath: string): Promise<ManifestEntry[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as ManifestEntry[];
  } catch {
    return [];
  }
}
