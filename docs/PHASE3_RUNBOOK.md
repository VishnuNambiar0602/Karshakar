# Phase 3 Operations Runbook

## Start an Orchestration Run
1. Execute local simulation:
```bash
npm run gcp:phase3
```
2. For real deployment, publish orchestration trigger payload with `jobId`, `requestId`, `datasetVersion`, and candidate model version.

## Failure Handling
- Inspect failed stages and DLQ entries.
- Re-run using same `jobId` with a new `requestId` after remediation.
- Confirm retries did not exceed policy thresholds.

## Observability Checklist
- Dashboard widgets show success rate, stage latency, DLQ count, and cost forecast.
- Alerts configured in `infra/gcp/monitoring/alerts.json` are active.
- Cloud Logging filters:
  - `jsonPayload.scope="gcp-orchestration.orchestrator"`
  - `jsonPayload.scope="gcp-orchestration.workflow"`

## Model Promotion and Rollback
- Promotion job advances candidate to production.
- If regression detected:
  1. Select prior production version.
  2. Execute rollback stage.
  3. Verify inference health and latency metrics.

## Release Rollback Path
- Registry state transitions:
  - `candidate -> production` on successful promote.
  - Current `production -> rolled_back` and target `staging/previous -> production` on rollback.
- Required checks before re-promote:
  - mIoU and pixel accuracy above threshold.
  - Inference schema compatibility unchanged.
  - No critical alerts active.
