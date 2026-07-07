import { describe, expect, it, beforeEach } from 'vitest';
import {
  createIdempotencyKey,
  defaultWorkflow,
  evaluateCostGuardrail,
  getRegistry,
  promoteModel,
  registerCandidate,
  resetIdempotencyState,
  resetRegistry,
  rollbackModel,
  runBatchOrchestration,
} from '@/gcp-orchestration';

beforeEach(() => {
  resetIdempotencyState();
  resetRegistry();
});

describe('phase 3 gcp orchestration', () => {
  it('creates deterministic idempotency keys', () => {
    const a = createIdempotencyKey({
      jobId: 'job-a',
      stage: 'workflow',
      datasetVersion: 'd1',
      requestId: 'r1',
    });

    const b = createIdempotencyKey({
      jobId: 'job-a',
      stage: 'workflow',
      datasetVersion: 'd1',
      requestId: 'r1',
    });

    expect(a).toBe(b);
  });

  it('executes workflow stages and publishes topics', async () => {
    const result = await runBatchOrchestration({
      jobId: 'job-1',
      requestId: 'req-1',
      datasetVersion: 'phase2-dataset-v1',
      modelVersionCandidate: 'phase2-v1',
      trigger: 'manual',
    });

    expect(result.state.status).toBe('completed');
    expect(result.publishedTopics).toContain(defaultWorkflow.steps[0]?.pubsubTopic);
    expect(result.dlqMessages.length).toBe(0);
  });

  it('sends failed stages to DLQ when retries are exhausted', async () => {
    const result = await runBatchOrchestration(
      {
        jobId: 'job-2',
        requestId: 'req-2',
        datasetVersion: 'phase2-dataset-v1',
        modelVersionCandidate: 'phase2-v1',
        trigger: 'manual',
      },
      {
        forceFailureStages: ['train'],
      }
    );

    expect(result.state.status).toBe('failed');
    expect(result.dlqMessages.length).toBeGreaterThan(0);
    expect(result.dlqMessages[0]?.stage).toBe('train');
  });

  it('blocks when budget hard-stop is reached', () => {
    const status = evaluateCostGuardrail(1300, 1300, 1);
    expect(status.shouldBlock).toBe(true);
  });

  it('supports model registry rollback path', () => {
    registerCandidate({
      modelId: 'unet-landcover-v1',
      version: 'v1',
      status: 'production',
      datasetVersion: 'd1',
      metrics: { mIoU: 0.89, pixelAccuracy: 0.94 },
      createdAt: new Date().toISOString(),
    });

    registerCandidate({
      modelId: 'unet-landcover-v1',
      version: 'v2',
      status: 'candidate',
      promotedFrom: 'v1',
      datasetVersion: 'd2',
      metrics: { mIoU: 0.87, pixelAccuracy: 0.91 },
      createdAt: new Date().toISOString(),
    });

    promoteModel('unet-landcover-v1', 'v2');

    const rolledBack = rollbackModel('unet-landcover-v1', 'v1');
    expect(rolledBack.status).toBe('production');
    expect(getRegistry('unet-landcover-v1').some((item) => item.status === 'rolled_back')).toBe(true);
  });
});
