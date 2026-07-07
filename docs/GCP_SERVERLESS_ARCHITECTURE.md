# GCP Serverless Batch Architecture (Phase 3)

## Objective
Implement production-grade serverless orchestration for preprocessing, training, inference, and model promotion.

## Components
- Cloud Run Jobs:
  - `ei-preprocess-job`
  - `ei-train-job`
  - `ei-inference-job`
  - `ei-promote-job`
- Pub/Sub topics for stage chaining and DLQ handling.
- Google Workflows definition for ordered orchestration and retry semantics.
- Monitoring and alert policies for reliability and latency.
- Budget and quota guardrails to contain costs.

## Data and Artifact Flow
1. Preprocess stage writes clean dataset artifacts to GCS.
2. Train stage writes model candidate artifact and experiment metadata.
3. Inference stage validates candidate serving contract.
4. Promote stage updates model registry state and release pointer.

## Reliability Controls
- Idempotent job key derived from `jobId + datasetVersion + requestId`.
- Stage-level retry with exponential backoff.
- Dead-letter queue topic for failed stage messages.
- Structured logs with scope names under `gcp-orchestration.*`.

## Cost Controls
- Budget thresholds: 50%, 80%, 100%.
- Hard stop at 100% forecast/actual.
- Daily run quota (`maxDailyPipelineRuns`).
- GCS and log retention lifecycle limits.

## Deployment Pointers
- Workflow config: `infra/gcp/workflows/batch-orchestrator.yaml`
- Pub/Sub config: `infra/gcp/pubsub/topics.json`
- Cloud Run jobs: `infra/gcp/cloud-run-jobs/jobs.json`
- Monitoring and alerts: `infra/gcp/monitoring/alerts.json`
- Budgets and lifecycle: `infra/gcp/budgets/budget.json`
