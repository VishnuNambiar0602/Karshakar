import { logger } from '@/lib/logger';
import { pushDeadLetter } from './dlq';
import { publish } from './pubsub';
import { executeCloudRunStage } from './cloud-run-jobs';
import type { PipelineRequest, RetryPolicy, StageExecutionResult, WorkflowDefinition } from './types';

function backoffDelaySeconds(retryPolicy: RetryPolicy, attempt: number): number {
  const delay = retryPolicy.initialDelaySeconds * Math.pow(retryPolicy.multiplier, Math.max(0, attempt - 1));
  return Math.min(delay, retryPolicy.maxDelaySeconds);
}

export async function executeWorkflow(
  definition: WorkflowDefinition,
  request: PipelineRequest,
  options?: { forceFailureStages?: Array<StageExecutionResult['stage']> }
): Promise<StageExecutionResult[]> {
  const stageResults: StageExecutionResult[] = [];

  for (const step of definition.steps) {
    publish(step.pubsubTopic, {
      jobId: request.jobId,
      requestId: request.requestId,
      stage: step.stage,
      datasetVersion: request.datasetVersion,
    });

    let success = false;
    let lastResult: StageExecutionResult | undefined;

    for (let attempt = 1; attempt <= step.retryPolicy.maxAttempts; attempt++) {
      const result = await executeCloudRunStage(step.stage, attempt, undefined, options);
      stageResults.push(result);
      lastResult = result;

      if (result.success) {
        success = true;
        break;
      }

      const delaySeconds = backoffDelaySeconds(step.retryPolicy, attempt);
      logger.warn('workflow_stage_retry', {
        scope: 'gcp-orchestration.workflow',
        stage: step.stage,
        attempt,
        delaySeconds,
        requestId: request.requestId,
      });
    }

    if (!success && lastResult) {
      pushDeadLetter({
        stage: step.stage,
        jobId: request.jobId,
        requestId: request.requestId,
        reason: lastResult.error ?? 'Unknown stage failure',
        attempts: lastResult.attempt,
        failedAt: new Date().toISOString(),
      });

      publish(definition.deadLetterTopic, {
        jobId: request.jobId,
        requestId: request.requestId,
        stage: step.stage,
        reason: lastResult.error ?? 'Unknown stage failure',
      });

      break;
    }
  }

  return stageResults;
}
