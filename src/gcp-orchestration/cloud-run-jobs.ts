import { logger } from '@/lib/logger';
import type { CloudRunJobDefinition, PipelineStage, StageExecutionResult } from './types';

export const defaultCloudRunJobs: CloudRunJobDefinition[] = [
  {
    stage: 'preprocess',
    serviceName: 'ei-preprocess-job',
    image: 'gcr.io/project/ei-preprocess:latest',
    command: ['npm', 'run', 'pipeline:run'],
    timeoutSeconds: 3600,
    maxRetries: 2,
    cpu: '2',
    memory: '4Gi',
  },
  {
    stage: 'train',
    serviceName: 'ei-train-job',
    image: 'gcr.io/project/ei-train:latest',
    command: ['npm', 'run', 'ml:phase2'],
    timeoutSeconds: 7200,
    maxRetries: 2,
    cpu: '4',
    memory: '16Gi',
  },
  {
    stage: 'inference',
    serviceName: 'ei-inference-job',
    image: 'gcr.io/project/ei-inference:latest',
    command: ['node', 'dist/inference.js'],
    timeoutSeconds: 1800,
    maxRetries: 2,
    cpu: '2',
    memory: '8Gi',
  },
  {
    stage: 'promote',
    serviceName: 'ei-promote-job',
    image: 'gcr.io/project/ei-promote:latest',
    command: ['node', 'dist/promote.js'],
    timeoutSeconds: 600,
    maxRetries: 1,
    cpu: '1',
    memory: '1Gi',
  },
];

function findDefinition(stage: PipelineStage, definitions: CloudRunJobDefinition[]): CloudRunJobDefinition {
  const found = definitions.find((item) => item.stage === stage);
  if (!found) {
    throw new Error(`No Cloud Run job definition found for stage ${stage}`);
  }
  return found;
}

export async function executeCloudRunStage(
  stage: PipelineStage,
  attempt: number,
  definitions: CloudRunJobDefinition[] = defaultCloudRunJobs,
  options?: { forceFailureStages?: PipelineStage[] }
): Promise<StageExecutionResult> {
  const definition = findDefinition(stage, definitions);
  const startedAt = new Date().toISOString();

  const shouldFail = options?.forceFailureStages?.includes(stage) ?? false;

  logger.info('cloud_run_stage_execute', {
    scope: 'gcp-orchestration.cloud-run',
    stage,
    serviceName: definition.serviceName,
    attempt,
  });

  if (shouldFail) {
    return {
      stage,
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      attempt,
      error: `Forced failure for stage ${stage}`,
    };
  }

  return {
    stage,
    success: true,
    startedAt,
    completedAt: new Date().toISOString(),
    attempt,
    outputUri: `gs://earth-insights/${stage}/${Date.now()}.json`,
  };
}
