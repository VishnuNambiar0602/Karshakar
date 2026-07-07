import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BandStats, NormalizationStats, SpectralTile } from './types';

interface RunningBandStats {
  min: number;
  max: number;
  sum: number;
  sumSquares: number;
  count: number;
}

function initStats(): RunningBandStats {
  return {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    sum: 0,
    sumSquares: 0,
    count: 0,
  };
}

function finalizeBandStats(stats: RunningBandStats): BandStats {
  const mean = stats.count === 0 ? 0 : stats.sum / stats.count;
  const variance = stats.count === 0 ? 0 : Math.max((stats.sumSquares / stats.count) - mean * mean, 0);

  return {
    min: stats.count === 0 ? 0 : stats.min,
    max: stats.count === 0 ? 0 : stats.max,
    mean,
    std: Math.sqrt(variance),
    count: stats.count,
  };
}

export function buildNormalizationStats(
  tiles: SpectralTile[],
  strategy: 'zscore' | 'minmax',
  datasetId: string
): NormalizationStats {
  const running: Record<string, RunningBandStats> = {};

  for (const tile of tiles) {
    for (const [band, values] of Object.entries(tile.bands)) {
      if (!running[band]) {
        running[band] = initStats();
      }

      for (const value of values) {
        if (Number.isNaN(value)) {
          continue;
        }

        running[band].min = Math.min(running[band].min, value);
        running[band].max = Math.max(running[band].max, value);
        running[band].sum += value;
        running[band].sumSquares += value * value;
        running[band].count += 1;
      }
    }
  }

  const bands: NormalizationStats['bands'] = {};
  for (const [band, stats] of Object.entries(running)) {
    bands[band] = finalizeBandStats(stats);
  }

  return {
    bands,
    strategy,
    generatedAt: new Date().toISOString(),
    datasetId,
  };
}

export function applyNormalization(tile: SpectralTile, stats: NormalizationStats): SpectralTile {
  const normalized: SpectralTile['bands'] = {};

  for (const [band, values] of Object.entries(tile.bands)) {
    const bandStats = stats.bands[band];
    if (!bandStats) {
      normalized[band] = [...values];
      continue;
    }

    normalized[band] = values.map((value) => {
      if (Number.isNaN(value)) {
        return value;
      }

      if (stats.strategy === 'zscore') {
        return bandStats.std === 0 ? 0 : (value - bandStats.mean) / bandStats.std;
      }

      const span = bandStats.max - bandStats.min;
      return span === 0 ? 0 : (value - bandStats.min) / span;
    });
  }

  return {
    ...tile,
    bands: normalized,
    metadata: {
      ...tile.metadata,
      normalizationStrategy: stats.strategy,
      normalizationDatasetId: stats.datasetId,
    },
  };
}

export async function persistNormalizationStats(filePath: string, stats: NormalizationStats): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(stats, null, 2), 'utf8');
}

export async function loadNormalizationStats(filePath: string): Promise<NormalizationStats> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as NormalizationStats;
}

export function validateNormalizationConsistency(
  baseline: NormalizationStats,
  candidate: NormalizationStats,
  tolerance = 1e-4
): { consistent: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const [band, baseStats] of Object.entries(baseline.bands)) {
    const candidateStats = candidate.bands[band];
    if (!candidateStats) {
      issues.push(`Missing band in candidate stats: ${band}`);
      continue;
    }

    if (Math.abs(baseStats.mean - candidateStats.mean) > tolerance) {
      issues.push(`Mean drift exceeds tolerance for ${band}`);
    }

    if (Math.abs(baseStats.std - candidateStats.std) > tolerance) {
      issues.push(`Std drift exceeds tolerance for ${band}`);
    }
  }

  return {
    consistent: issues.length === 0,
    issues,
  };
}
