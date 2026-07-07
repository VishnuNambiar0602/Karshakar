import path from 'node:path';
import { promises as fs } from 'node:fs';
import { appendExperimentRun } from './experiments';
import { packageModelArtifact, persistModelArtifact } from './artifact';
import { stratifiedSplitDataset } from './dataset';
import { runHyperparameterSweep } from './sweep';
import { trainUNetModel } from './training';
import type { DatasetSample, SweepResult, TrainingConfig, UNetConfig } from './types';

export interface PipelineRunResult {
  experimentLogPath: string;
  artifactPath: string;
  sweepSummary: SweepResult;
}

function syntheticSample(idx: number): DatasetSample {
  const dominantClass = idx % 4;
  const labelMask = new Array(256).fill(dominantClass);
  const signal = [
    0.2 + dominantClass * 0.15,
    dominantClass === 1 ? 0.7 : 0.2,
    dominantClass === 3 ? 0.65 : 0.15,
    dominantClass === 2 ? 0.6 : 0.2,
  ];

  return {
    id: `sample-${idx}`,
    dominantClass,
    features: [...signal, idx / 100],
    labelMask,
  };
}

export function generateSyntheticDataset(size = 80): DatasetSample[] {
  return new Array(size).fill(null).map((_, idx) => syntheticSample(idx));
}

export async function runPhase2TrainingPipeline(outputDir: string): Promise<PipelineRunResult> {
  const dataset = generateSyntheticDataset();
  const split = stratifiedSplitDataset(dataset, 20260310);

  const baseModelConfig: Omit<UNetConfig, 'encoderDepth'> = {
    modelId: 'unet-landcover-v1',
    inputChannels: 5,
    numClasses: 4,
    baseFilters: 32,
    dropoutRate: 0.1,
  };

  const baseTrainingConfig: Omit<TrainingConfig, 'learningRate' | 'batchSize' | 'lossStrategy'> = {
    datasetVersion: 'phase2-dataset-v1',
    seed: 20260310,
    epochs: 10,
    augmentationPolicyVersion: 'phase1-aug-v1',
  };

  const sweep = runHyperparameterSweep(
    split,
    baseModelConfig,
    baseTrainingConfig,
    {
      learningRates: [0.0005, 0.001, 0.002],
      batchSizes: [8, 16],
      lossStrategies: ['weighted-cross-entropy', 'focal'],
      encoderDepths: [3, 4, 5],
    },
    0.88
  );

  const experimentLogPath = path.join(outputDir, 'experiments.json');
  await Promise.all(sweep.runs.map(async (run) => appendExperimentRun(experimentLogPath, run)));

  const bestTraining = trainUNetModel(
    split,
    sweep.bestRun.modelConfig,
    sweep.bestRun.trainingConfig
  );

  const artifact = packageModelArtifact(bestTraining.run, 'phase2-v1');
  const artifactPath = path.join(outputDir, 'models', 'unet-landcover-v1.json');
  await persistModelArtifact(artifactPath, artifact);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'sweep-summary.json'),
    JSON.stringify(
      {
        reachedTarget: sweep.reachedTarget,
        targetMiou: sweep.targetMiou,
        bestRunId: sweep.bestRun.runId,
        bestMiou: sweep.bestRun.bestMetrics.mIoU,
      },
      null,
      2
    ),
    'utf8'
  );

  return {
    experimentLogPath,
    artifactPath,
    sweepSummary: sweep,
  };
}
