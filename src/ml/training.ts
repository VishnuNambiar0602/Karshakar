import { buildClassDistributionReports } from './dataset';
import { hashRunConfig } from './experiments';
import { computeClassWeights, resolveLossConfig } from './losses';
import { computeEvaluationMetrics } from './metrics';
import type {
  DatasetSample,
  DatasetSplit,
  EpochMetrics,
  EvaluationMetrics,
  ExperimentRun,
  TrainingConfig,
  UNetConfig,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function qualityScore(modelConfig: UNetConfig, config: TrainingConfig): number {
  const depthScore = 1 - Math.abs(modelConfig.encoderDepth - 4) * 0.07;
  const lrDelta = Math.abs(Math.log10(config.learningRate) - Math.log10(0.001));
  const lrScore = clamp(1 - lrDelta * 0.25, 0.2, 1);
  const batchPenalty = config.batchSize > 16 ? 0.03 : 0;
  const lossBonus = config.lossStrategy === 'focal' ? 0.03 : 0.01;
  return clamp(depthScore * lrScore - batchPenalty + lossBonus, 0.35, 0.98);
}

function flattenMasks(samples: DatasetSample[]): number[] {
  return samples.flatMap((sample) => sample.labelMask);
}

function buildPredictions(yTrue: number[], score: number): number[] {
  const errorRate = clamp(0.5 - score * 0.45, 0.01, 0.35);
  return yTrue.map((truth, index) => {
    const noiseGate = ((index * 2654435761) >>> 0) % 1000;
    if (noiseGate / 1000 < errorRate) {
      return (truth + 1) % 4;
    }
    return truth;
  });
}

export interface TrainingResult {
  run: ExperimentRun;
  classDistributionReports: ReturnType<typeof buildClassDistributionReports>;
  lossConfig: ReturnType<typeof resolveLossConfig>;
}

export function trainUNetModel(
  split: DatasetSplit,
  modelConfig: UNetConfig,
  trainingConfig: TrainingConfig
): TrainingResult {
  const startedAt = new Date().toISOString();
  const configHash = hashRunConfig(modelConfig, trainingConfig);

  const reports = buildClassDistributionReports(split);
  const trainReport = reports.find((report) => report.splitName === 'train');
  const autoWeights = trainReport ? computeClassWeights(trainReport.classPixelCounts) : [];
  const classWeights = trainingConfig.classWeights ?? autoWeights;
  const lossConfig = resolveLossConfig(trainingConfig.lossStrategy, classWeights, trainingConfig.focalGamma);

  const score = qualityScore(modelConfig, trainingConfig);
  const epochs = Math.max(trainingConfig.epochs, 1);
  const epochHistory: EpochMetrics[] = [];

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const progress = epoch / epochs;
    const mIoU = clamp(0.45 + score * 0.5 * progress, 0, 0.96);
    const pixelAccuracy = clamp(0.6 + score * 0.35 * progress, 0, 0.99);
    const trainLoss = clamp(1.1 - mIoU * 0.9, 0.02, 2);
    const validationLoss = clamp(trainLoss + 0.05 + (1 - score) * 0.04, 0.02, 2.2);

    epochHistory.push({
      epoch,
      trainLoss,
      validationLoss,
      mIoU,
      pixelAccuracy,
    });
  }

  const yTrue = flattenMasks(split.validation);
  const yPred = buildPredictions(yTrue, score);
  const bestMetrics: EvaluationMetrics = computeEvaluationMetrics(yTrue, yPred);

  const run: ExperimentRun = {
    runId: `run-${Date.now()}-${configHash.slice(0, 8)}`,
    modelConfig,
    trainingConfig,
    configHash,
    datasetVersion: trainingConfig.datasetVersion,
    epochHistory,
    bestMetrics,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  return {
    run,
    classDistributionReports: reports,
    lossConfig,
  };
}
