# Observability and SLO Baseline

## Request Tracing
- Structured logs include `requestId`, `userId`, `route`, `ip`, and `elapsedMs`.
- Server actions establish trace context and propagate request IDs to external API calls.

## SLO Targets
- API p95 latency: <= 1500ms for non-batch actions.
- Server action error rate: <= 1% rolling 24h.
- Batch job success rate: >= 98% rolling 24h.

## Dashboard Signals
- `action_failed_attempt` and `rate_limited` log counts.
- `metrics_background_flow_failed` queue depth and failure counts.
- `orchestration_metrics_summary` success/failure ratios.

## Alerting Rules
- Trigger warning when p95 latency exceeds 1500ms for 15 minutes.
- Trigger critical when error rate exceeds 2% for 10 minutes.
- Trigger warning when job success rate drops below 98% over 1 hour.
