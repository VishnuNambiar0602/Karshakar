import { logger } from '@/lib/logger';
import { defaultCostGuardrails, evaluateCostGuardrail } from './cost-guardrails';
import { getDeadLetters, resetDeadLetters } from './dlq';
import { createIdempotencyKey, isDuplicateRequest, markRequestProcessed } from './idempotency';
import { defaultAlertPolicies, summarizeStageMetrics } from './observability';
import { getPublishedTopics, resetPubSubState } from './pubsub';
import { executeWorkflow } from './workflow';
import type { JobStateRecord, OrchestrationResult, PipelineRequest, WorkflowDefinition } from './types';

export const defaultWorkflow: WorkflowDefinition = {
  name: 'earth-insights-batch-workflow',
  deadLetterTopic: 'earth-insights.pipeline.dlq',
  steps: [
    {
      stage: 'preprocess',
      pubsubTopic: 'earth-insights.pipeline.preprocess',
      cloudRunServiceName: 'ei-preprocess-job',
      retryPolicy: {
        maxAttempts: 3,
        initialDelaySeconds: 5,
        maxDelaySeconds: 60,
        multiplier: 2,
      },
    },
    {
      stage: 'train',
      pubsubTopic: 'earth-insights.pipeline.train',
      cloudRunServiceName: 'ei-train-job',
      retryPolicy: {
        maxAttempts: 3,
        initialDelaySeconds: 10,
        maxDelaySeconds: 120,
        multiplier: 2,
      },
    },
    {
      stage: 'inference',
      pubsubTopic: 'earth-insights.pipeline.inference',
      cloudRunServiceName: 'ei-inference-job',
      retryPolicy: {
        maxAttempts: 2,
        initialDelaySeconds: 5,
        maxDelaySeconds: 30,
        multiplier: 2,
      },
    },
    {
      stage: 'promote',
      pubsubTopic: 'earth-insights.pipeline.promote',
      cloudRunServiceName: 'ei-promote-job',
      retryPolicy: {
        maxAttempts: 2,
        initialDelaySeconds: 3,
        maxDelaySeconds: 20,
        multiplier: 2,
      },
    },
  ],
};

export interface OrchestratorOptions {
  workflow?: WorkflowDefinition;
  forceFailureStages?: Array<'preprocess' | 'train' | 'inference' | 'promote'>;
  spendToDateUsd?: number;
  forecastMonthEndUsd?: number;
  dailyRunCount?: number;
}

export async function runBatchOrchestration(
  request: PipelineRequest,
  options: OrchestratorOptions = {}
): Promise<OrchestrationResult> {
  const key = createIdempotencyKey({
    jobId: request.jobId,
    stage: 'workflow',
    datasetVersion: request.datasetVersion,
    requestId: request.requestId,
  });

  if (isDuplicateRequest(key)) {
    throw new Error(`Duplicate orchestration request detected for job ${request.jobId}`);
  }
  markRequestProcessed(key);

  const costStatus = evaluateCostGuardrail(
    options.spendToDateUsd ?? 200,
    options.forecastMonthEndUsd ?? 600,
    options.dailyRunCount ?? 1,
    defaultCostGuardrails
  );

  if (costStatus.shouldBlock) {
    throw new Error(costStatus.message);
  }

  resetDeadLetters();
  resetPubSubState();

  const stages = await executeWorkflow(options.workflow ?? defaultWorkflow, request, {
    forceFailureStages: options.forceFailureStages,
  });

  const summary = summarizeStageMetrics(stages);
  if (summary.failures > 0) {
    logger.error('orchestration_failed', {
      scope: 'gcp-orchestration.orchestrator',
      jobId: request.jobId,
      failures: summary.failures,
    });
  }

  logger.info('alert_policies_loaded', {
    scope: 'gcp-orchestration.orchestrator',
    policies: defaultAlertPolicies.map((policy) => policy.name),
  });

  const state: JobStateRecord = {
    jobId: request.jobId,
    requestId: request.requestId,
    status: summary.failures > 0 ? 'failed' : 'completed',
    stages,
    updatedAt: new Date().toISOString(),
  };

  return {
    state,
    dlqMessages: getDeadLetters(),
    publishedTopics: getPublishedTopics(),
  };
}
