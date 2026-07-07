import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  augmentTile,
  buildNormalizationStats,
  loadManifest,
  runChunkedPreprocessingJob,
  type SpectralTile,
  validateOneTerabyteRun,
} from '@/data-pipeline';

const tmpDirectories: string[] = [];

function makeTile(tileId: string, cloudBit = false): SpectralTile {
  const qaCloud = cloudBit ? 1 << 10 : 0;
  return {
    bands: {
      B02: [0.1, 0.2, 0.3, 0.4],
      B03: [0.2, 0.3, 0.4, 0.5],
    },
    qa60: [qaCloud, qaCloud, qaCloud, qaCloud],
    scl: [4, 5, 6, 7],
    metadata: {
      tileId,
      timestamp: '2026-01-01T00:00:00.000Z',
      crs: 'EPSG:3857',
      resolutionMeters: 20,
      width: 2,
      height: 2,
    },
  };
}

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirectories.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tmpDirectories.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    })
  );
});

describe('data pipeline phase 1 primitives', () => {
  it('applies deterministic augmentation with same seed', () => {
    const tile = makeTile('tile-a');
    const policy = {
      version: 'v1',
      seed: 42,
      flipHorizontal: true,
      flipVertical: true,
      rotations: [0, 90, 180, 270] as Array<0 | 90 | 180 | 270>,
      cropScaleRange: [0.85, 0.95] as [number, number],
      brightnessJitter: 0.05,
      spectralNoiseStd: 0.001,
    };

    const a = augmentTile(tile, policy, 3);
    const b = augmentTile(tile, policy, 3);

    expect(a.bands.B02).toEqual(b.bands.B02);
    expect(a.metadata.augmentationVersion).toBe('v1');
    expect(a.metadata.augmentationSeed).toBe(45);
  });

  it('runs resumable chunked preprocessing and writes manifest/checkpoint', async () => {
    const root = await makeTempDir('pipeline-job-');
    const outputDirectory = path.join(root, 'output');
    const manifestFilePath = path.join(root, 'manifest.json');
    const checkpointFilePath = path.join(root, 'checkpoint.json');

    const tiles = [makeTile('t1'), makeTile('t2'), makeTile('t3')];

    const first = await runChunkedPreprocessingJob(
      tiles,
      {
        jobId: 'job-1',
        chunkSize: 2,
        retryLimit: 1,
        checkpointFilePath,
        manifestFilePath,
        outputDirectory,
        transformVersion: 't-v1',
        policyVersion: 'p-v1',
      },
      {
        datasetId: 'dataset-a',
        normalizationStrategy: 'minmax',
        cloudPolicyVersion: 'cloud-v1',
        augmentationPolicyVersion: 'aug-v1',
        harmonizationPolicyVersion: 'harm-v1',
      }
    );

    expect(first.checkpoint.processedTiles).toBe(3);
    expect(first.checkpoint.lastChunkIndex).toBe(1);

    const manifest = await loadManifest(manifestFilePath);
    expect(manifest).toHaveLength(3);
    expect(manifest[0]?.policyVersion).toContain('aug:aug-v1');

    const resumed = await runChunkedPreprocessingJob(
      tiles,
      {
        jobId: 'job-1',
        chunkSize: 2,
        retryLimit: 1,
        checkpointFilePath,
        manifestFilePath,
        outputDirectory,
        transformVersion: 't-v1',
        policyVersion: 'p-v1',
      },
      {
        datasetId: 'dataset-a',
        normalizationStrategy: 'minmax',
        cloudPolicyVersion: 'cloud-v1',
        augmentationPolicyVersion: 'aug-v1',
        harmonizationPolicyVersion: 'harm-v1',
      }
    );

    expect(resumed.checkpoint.processedTiles).toBe(3);
    expect((await loadManifest(manifestFilePath)).length).toBe(3);
  });

  it('evaluates one-terabyte benchmark threshold', () => {
    const result = validateOneTerabyteRun({
      bytesProcessed: 1_099_511_627_776,
      tilesProcessed: 100,
      secondsElapsed: 10,
      throughputBytesPerSecond: 100,
      reachedOneTerabyte: true,
    });

    expect(result.passed).toBe(true);
  });

  it('builds normalization stats for windows consistency checks', () => {
    const baseline = buildNormalizationStats([makeTile('b')], 'zscore', 'd1');
    const candidate = buildNormalizationStats([makeTile('c')], 'zscore', 'd2');

    expect(Object.keys(baseline.bands).length).toBeGreaterThan(0);
    expect(Object.keys(candidate.bands).length).toBeGreaterThan(0);
  });
});
