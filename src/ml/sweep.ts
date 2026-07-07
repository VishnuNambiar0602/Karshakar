import { trainUNetModel } from './training';
import type { DatasetSplit, HyperparameterSearchSpace, SweepResult, TrainingConfig, UNetConfig } from './types';

export function runHyperparameterSweep(
  split: DatasetSplit,
  baseModelConfig: Omit<UNetConfig, 'encoderDepth'>,
  baseTrainingConfig: Omit<TrainingConfig, 'learningRate' | 'batchSize' | 'lossStrategy'>,
  search: HyperparameterSearchSpace,
  targetMiou = 0.88
): SweepResult {
  const runs = [];

  for (const encoderDepth of search.encoderDepths) {
    for (const learningRate of search.learningRates) {
      for (const batchSize of search.batchSizes) {
        for (const lossStrategy of search.lossStrategies) {
          const modelConfig: UNetConfig = {
            ...baseModelConfig,
            encoderDepth,
          };

          const trainingConfig: TrainingConfig = {
            ...baseTrainingConfig,
            learningRate,
            batchSize,
            lossStrategy,
          };

          const result = trainUNetModel(split, modelConfig, trainingConfig);
          runs.push(result.run);
        }
      }
    }
  }

  runs.sort((a, b) => b.bestMetrics.mIoU - a.bestMetrics.mIoU);

  const bestRun = runs[0];
  if (!bestRun) {
    throw new Error('Hyperparameter sweep produced no runs.');
  }

  return {
    runs,
    bestRun,
    reachedTarget: bestRun.bestMetrics.mIoU >= targetMiou,
    targetMiou,
  };
}
