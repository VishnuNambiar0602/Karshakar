import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '@/lib/logger';
import { applyCloudMask, defaultCloudMaskPolicy } from './cloud-mask';
import { applyNormalization, buildNormalizationStats, persistNormalizationStats } from './normalization';
import { augmentTile, defaultAugmentationPolicy } from './augmentation';
import { appendManifestEntry, buildManifestEntry } from './manifest';
import { createInitialCheckpoint, loadCheckpoint, saveCheckpoint } from './checkpoint';
import { defaultHarmonizationPolicy, stampHarmonizationMetadata } from './harmonization';
import type {
  BenchmarkResult,
  ChunkedJobOptions,
  JobCheckpoint,
  SpectralTile,
} from './types';

export interface PreprocessOptions {
  datasetId: string;
  normalizationStrategy: 'zscore' | 'minmax';
  cloudPolicyVersion: string;
  augmentationPolicyVersion: string;
  harmonizationPolicyVersion: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
}

function estimateTileBytes(tile: SpectralTile): number {
  return Buffer.byteLength(JSON.stringify(tile), 'utf8');
}

async function writeOutputTile(outputDirectory: string, tile: SpectralTile): Promise<string> {
  await fs.mkdir(outputDirectory, { recursive: true });
  const filePath = path.join(outputDirectory, `${tile.metadata.tileId}.json`);
  await fs.writeFile(filePath, JSON.stringify(tile), 'utf8');
  return filePath;
}

async function processTile(
  tile: SpectralTile,
  index: number,
  statsDataset: ReturnType<typeof buildNormalizationStats>,
  options: ChunkedJobOptions
): Promise<{ outputUri: string; cloudCoverageRatio: number; bytesProcessed: number }> {
  const masked = applyCloudMask(tile, defaultCloudMaskPolicy);
  if (!masked.keep) {
    throw new Error(`Cloud policy rejected tile ${tile.metadata.tileId}`);
  }

  const normalized = applyNormalization(masked.maskedTile, statsDataset);
  const harmonized = stampHarmonizationMetadata(normalized, defaultHarmonizationPolicy);
  const augmented = augmentTile(harmonized, defaultAugmentationPolicy, index);

  const outputUri = await writeOutputTile(options.outputDirectory, augmented);
  const bytesProcessed = estimateTileBytes(tile);

  return {
    outputUri,
    cloudCoverageRatio: masked.cloudCoverageRatio,
    bytesProcessed,
  };
}

async function processChunkWithRetries(
  tiles: SpectralTile[],
  chunkIndex: number,
  statsDataset: ReturnType<typeof buildNormalizationStats>,
  options: ChunkedJobOptions,
  checkpoint: JobCheckpoint,
  preprocessOptions: PreprocessOptions
): Promise<JobCheckpoint> {
  let failures = checkpoint.failures;

  for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    const tile = tiles[tileIndex];
    let attempts = 0;
    let done = false;

    while (!done && attempts <= options.retryLimit) {
      try {
        const output = await processTile(tile, chunkIndex * options.chunkSize + tileIndex, statsDataset, options);

        await appendManifestEntry(
          options.manifestFilePath,
          buildManifestEntry({
            tile,
            outputUri: output.outputUri,
            transformVersion: `${options.transformVersion}|norm:${preprocessOptions.normalizationStrategy}`,
            policyVersion: `${options.policyVersion}|cloud:${preprocessOptions.cloudPolicyVersion}|aug:${preprocessOptions.augmentationPolicyVersion}|harm:${preprocessOptions.harmonizationPolicyVersion}`,
            bytesProcessed: output.bytesProcessed,
            cloudCoverageRatio: output.cloudCoverageRatio,
          })
        );

        checkpoint.processedTiles += 1;
        checkpoint.processedBytes += output.bytesProcessed;
        done = true;
      } catch (error) {
        attempts += 1;
        if (attempts > options.retryLimit) {
          failures += 1;
          logger.warn('tile_processing_failed', {
            scope: 'data-pipeline.job',
            tileId: tile.metadata.tileId,
            retryLimit: options.retryLimit,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  checkpoint.failures = failures;
  checkpoint.lastChunkIndex = chunkIndex;
  await saveCheckpoint(options.checkpointFilePath, checkpoint);
  return checkpoint;
}

export async function runChunkedPreprocessingJob(
  tiles: SpectralTile[],
  options: ChunkedJobOptions,
  preprocessOptions: PreprocessOptions
): Promise<{ checkpoint: JobCheckpoint; benchmark: BenchmarkResult; normalizationStatsPath: string }> {
  const start = Date.now();
  const chunks = chunk(tiles, options.chunkSize);
  const checkpoint = await loadCheckpoint(options.checkpointFilePath, options.jobId);

  const statsDataset = buildNormalizationStats(tiles, preprocessOptions.normalizationStrategy, preprocessOptions.datasetId);
  const statsPath = path.join(path.dirname(options.manifestFilePath), `${preprocessOptions.datasetId}.normalization.json`);
  await persistNormalizationStats(statsPath, statsDataset);

  const activeCheckpoint = checkpoint.jobId === options.jobId ? checkpoint : createInitialCheckpoint(options.jobId);

  for (let chunkIndex = activeCheckpoint.lastChunkIndex + 1; chunkIndex < chunks.length; chunkIndex++) {
    const chunkTiles = chunks[chunkIndex] ?? [];
    await processChunkWithRetries(chunkTiles, chunkIndex, statsDataset, options, activeCheckpoint, preprocessOptions);
  }

  const elapsedSeconds = Math.max((Date.now() - start) / 1000, 1e-9);
  const benchmark: BenchmarkResult = {
    bytesProcessed: activeCheckpoint.processedBytes,
    tilesProcessed: activeCheckpoint.processedTiles,
    secondsElapsed: elapsedSeconds,
    throughputBytesPerSecond: activeCheckpoint.processedBytes / elapsedSeconds,
    reachedOneTerabyte: activeCheckpoint.processedBytes >= 1_099_511_627_776,
  };

  return {
    checkpoint: activeCheckpoint,
    benchmark,
    normalizationStatsPath: statsPath,
  };
}
