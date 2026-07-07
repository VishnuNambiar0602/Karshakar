export type SegmentationClassName = 'other' | 'vegetation' | 'builtUp' | 'water';

export interface UNetConfig {
  modelId: string;
  encoderDepth: 2 | 3 | 4 | 5;
  inputChannels: number;
  numClasses: number;
  baseFilters: number;
  dropoutRate: number;
}

export type LossStrategy = 'weighted-cross-entropy' | 'focal';

export interface TrainingConfig {
  datasetVersion: string;
  seed: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  lossStrategy: LossStrategy;
  classWeights?: number[];
  focalGamma?: number;
  augmentationPolicyVersion: string;
}

export interface HyperparameterSearchSpace {
  learningRates: number[];
  batchSizes: number[];
  lossStrategies: LossStrategy[];
  encoderDepths: UNetConfig['encoderDepth'][];
}

export interface DatasetSample {
  id: string;
  dominantClass: number;
  features: number[];
  labelMask: number[];
}

export interface DatasetSplit {
  train: DatasetSample[];
  validation: DatasetSample[];
  test: DatasetSample[];
}

export interface ClassDistributionReport {
  splitName: 'train' | 'validation' | 'test' | 'all';
  sampleCount: number;
  classPixelCounts: Record<number, number>;
  classPixelRatios: Record<number, number>;
}

export interface PerClassMetrics {
  iou: Record<number, number>;
  dice: Record<number, number>;
}

export interface EvaluationMetrics {
  mIoU: number;
  pixelAccuracy: number;
  perClass: PerClassMetrics;
}

export interface EpochMetrics {
  epoch: number;
  trainLoss: number;
  validationLoss: number;
  mIoU: number;
  pixelAccuracy: number;
}

export interface ExperimentRun {
  runId: string;
  modelConfig: UNetConfig;
  trainingConfig: TrainingConfig;
  configHash: string;
  datasetVersion: string;
  epochHistory: EpochMetrics[];
  bestMetrics: EvaluationMetrics;
  startedAt: string;
  completedAt: string;
}

export interface SweepResult {
  runs: ExperimentRun[];
  bestRun: ExperimentRun;
  reachedTarget: boolean;
  targetMiou: number;
}

export interface ModelArtifact {
  modelId: string;
  version: string;
  createdAt: string;
  datasetVersion: string;
  configHash: string;
  encoderDepth: number;
  numClasses: number;
  classNames: string[];
  validationMetrics: EvaluationMetrics;
  inferenceSchemaVersion: string;
}

export interface SegmentationInferenceInput {
  width: number;
  height: number;
  features: {
    vegetationRatio: number;
    waterRatio: number;
    builtUpRatio: number;
    otherRatio: number;
    ndvi: number;
    ndwi: number;
    ndbi: number;
    nbr: number;
  };
}

export interface SegmentationInferenceOutput {
  mask: number[];
  width: number;
  height: number;
  meanConfidence: number;
  classConfidence: Record<string, number>;
  postProcessing: {
    smoothingKernel: number;
    isolatedPixelFixes: number;
  };
  model: {
    modelId: string;
    version: string;
    configHash: string;
  };
}
