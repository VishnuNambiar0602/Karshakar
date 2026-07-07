export type PipelineStage = 'preprocess' | 'train' | 'inference' | 'promote';

export interface PipelineRequest {
  jobId: string;
  requestId: string;
  datasetVersion: string;
  modelVersionCandidate: string;
  trigger: 'manual' | 'scheduled' | 'event';
}

export interface CloudRunJobDefinition {
  stage: PipelineStage;
  serviceName: string;
  image: string;
  command: string[];
  timeoutSeconds: number;
  maxRetries: number;
  cpu: string;
  memory: string;
}

export interface StageExecutionResult {
  stage: PipelineStage;
  success: boolean;
  startedAt: string;
  completedAt: string;
  attempt: number;
  outputUri?: string;
  error?: string;
}

export interface JobStateRecord {
  jobId: string;
  requestId: string;
  status: 'running' | 'completed' | 'failed';
  stages: StageExecutionResult[];
  updatedAt: string;
}

export interface PubSubEnvelope<T = Record<string, unknown>> {
  topic: string;
  messageId: string;
  timestamp: string;
  payload: T;
}

export interface DeadLetterMessage {
  stage: PipelineStage;
  jobId: string;
  requestId: string;
  reason: string;
  attempts: number;
  failedAt: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelaySeconds: number;
  maxDelaySeconds: number;
  multiplier: number;
}

export interface AlertPolicy {
  name: string;
  condition: string;
  severity: 'warning' | 'critical';
  channel: 'email' | 'slack' | 'pagerduty';
  threshold: number;
}

export interface CostGuardrailConfig {
  monthlyBudgetUsd: number;
  forecastAlertThresholdRatio: number;
  hardStopThresholdRatio: number;
  gcsRetentionDays: number;
  maxDailyRunCount: number;
}

export interface ModelRegistryEntry {
  modelId: string;
  version: string;
  status: 'candidate' | 'staging' | 'production' | 'rolled_back';
  promotedFrom?: string;
  datasetVersion: string;
  metrics: {
    mIoU: number;
    pixelAccuracy: number;
  };
  createdAt: string;
}

export interface WorkflowStep {
  stage: PipelineStage;
  pubsubTopic: string;
  cloudRunServiceName: string;
  retryPolicy: RetryPolicy;
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
  deadLetterTopic: string;
}

export interface OrchestrationResult {
  state: JobStateRecord;
  dlqMessages: DeadLetterMessage[];
  publishedTopics: string[];
}
