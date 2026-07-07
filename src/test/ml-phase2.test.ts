import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildUNetBlueprint,
  computeEvaluationMetrics,
  generateSyntheticDataset,
  loadModelArtifact,
  runHyperparameterSweep,
  runPhase2TrainingPipeline,
  runSegmentationInference,
  stratifiedSplitDataset,
  trainUNetModel,
} from '@/ml';

const tmpDirs: string[] = [];

async function tempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('phase 2 ml stack', () => {
  it('builds a configurable U-Net blueprint', () => {
    const blueprint = buildUNetBlueprint({
      modelId: 'unet-1',
      encoderDepth: 4,
      inputChannels: 5,
      numClasses: 4,
      baseFilters: 32,
      dropoutRate: 0.1,
    });

    expect(blueprint.layers.some((layer) => layer.type === 'concat')).toBe(true);
    expect(blueprint.layers[blueprint.layers.length - 1]?.type).toBe('output');
  });

  it('creates stratified split and evaluates metrics', () => {
    const samples = generateSyntheticDataset(40);
    const split = stratifiedSplitDataset(samples, 42);

    expect(split.train.length).toBeGreaterThan(0);
    expect(split.validation.length).toBeGreaterThan(0);
    expect(split.test.length).toBeGreaterThan(0);

    const metrics = computeEvaluationMetrics([0, 1, 2, 3], [0, 1, 2, 3]);
    expect(metrics.mIoU).toBe(1);
    expect(metrics.pixelAccuracy).toBe(1);
  });

  it('trains and sweeps to track best mIoU run', () => {
    const split = stratifiedSplitDataset(generateSyntheticDataset(60), 20260310);

    const run = trainUNetModel(
      split,
      {
        modelId: 'unet-1',
        encoderDepth: 4,
        inputChannels: 5,
        numClasses: 4,
        baseFilters: 32,
        dropoutRate: 0.1,
      },
      {
        datasetVersion: 'd1',
        seed: 1,
        epochs: 8,
        batchSize: 8,
        learningRate: 0.001,
        lossStrategy: 'focal',
        augmentationPolicyVersion: 'a1',
      }
    );

    expect(run.run.epochHistory).toHaveLength(8);

    const sweep = runHyperparameterSweep(
      split,
      {
        modelId: 'unet-1',
        inputChannels: 5,
        numClasses: 4,
        baseFilters: 32,
        dropoutRate: 0.1,
      },
      {
        datasetVersion: 'd1',
        seed: 1,
        epochs: 6,
        augmentationPolicyVersion: 'a1',
      },
      {
        learningRates: [0.001],
        batchSizes: [8],
        lossStrategies: ['focal'],
        encoderDepths: [4],
      },
      0.88
    );

    expect(sweep.bestRun.bestMetrics.mIoU).toBeGreaterThan(0.8);
  });

  it('runs pipeline and loads packaged artifact for inference', async () => {
    const outputDir = await tempDir('ml-phase2-');
    const result = await runPhase2TrainingPipeline(outputDir);

    expect(result.sweepSummary.bestRun.bestMetrics.mIoU).toBeGreaterThan(0.8);

    const artifact = await loadModelArtifact(result.artifactPath);
    const inference = runSegmentationInference(
      {
        width: 16,
        height: 16,
        features: {
          vegetationRatio: 0.4,
          waterRatio: 0.2,
          builtUpRatio: 0.25,
          otherRatio: 0.15,
          ndvi: 0.6,
          ndwi: 0.2,
          ndbi: 0.3,
          nbr: 0.5,
        },
      },
      artifact
    );

    expect(inference.mask).toHaveLength(256);
    expect(inference.meanConfidence).toBeGreaterThan(0);
  });
});
