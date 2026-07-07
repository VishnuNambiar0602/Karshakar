import { logger } from '@/lib/logger';
import type { AlertPolicy, StageExecutionResult } from './types';

export const defaultAlertPolicies: AlertPolicy[] = [
  {
    name: 'pipeline-error-rate',
    condition: 'error_rate > 0.05 over 5m',
    severity: 'critical',
    channel: 'pagerduty',
    threshold: 0.05,
  },
  {
    name: 'pipeline-latency',
    condition: 'p95_duration_seconds > 1800 over 15m',
    severity: 'warning',
    channel: 'slack',
    threshold: 1800,
  },
  {
    name: 'dlq-growth',
    condition: 'dead_letter_count > 10 over 10m',
    severity: 'critical',
    channel: 'email',
    threshold: 10,
  },
];

export interface StageMetricsSummary {
  total: number;
  failures: number;
  successRate: number;
}

export function summarizeStageMetrics(results: StageExecutionResult[]): StageMetricsSummary {
  const total = results.length;
  const failures = results.filter((result) => !result.success).length;
  const successRate = total === 0 ? 1 : (total - failures) / total;

  logger.info('orchestration_metrics_summary', {
    scope: 'gcp-orchestration.observability',
    total,
    failures,
    successRate,
  });

  return {
    total,
    failures,
    successRate,
  };
}

export function buildMonitoringDashboardConfig(projectId: string): Record<string, unknown> {
  return {
    projectId,
    widgets: [
      { type: 'timeseries', metric: 'custom.googleapis.com/pipeline/success_rate' },
      { type: 'timeseries', metric: 'custom.googleapis.com/pipeline/stage_duration' },
      { type: 'timeseries', metric: 'custom.googleapis.com/pipeline/dlq_count' },
    ],
  };
}
