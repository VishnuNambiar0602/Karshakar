# Earth Insights Roadmap (Goal-Oriented)

> Last updated: 2026-03-10
> Purpose: Close the gap between the current platform and the target end-state capabilities.

## Target End-State Capabilities

1. Applied cloud masking, normalization, and augmentation for clean dataset generation.
2. Automated preprocessing pipeline for multi-spectral imagery at >1TB scale.
3. U-Net segmentation for land cover detection with >=88% validation accuracy.
4. Serverless batch processing workflows on Google Cloud.
5. Interactive GIS dashboards for visualization and trend analysis.

## Current State Snapshot

### What exists now
- Geospatial metrics pipeline with Earth Engine (`compute-metrics.ts`) and land cover visual output.
- Interactive dashboard and chart-based analysis UI.
- AI-assisted interpretation and prediction flows.
- Firestore-backed async computation job pattern.

### Key gaps vs target
- No explicit cloud masking + dataset normalization/augmentation pipeline for ML dataset generation.
- No dedicated ML training/evaluation pipeline for semantic segmentation.
- No U-Net training/inference stack currently in repo.
- No production-grade serverless orchestration on GCP (Cloud Run Jobs / Workflows / Pub/Sub).
- No formal MLOps guardrails (dataset versioning, experiment tracking, model registry, drift monitoring).
- Security/reliability debt from legacy TODO blocks production readiness.

## Guiding Principles

- Security and correctness first, then scale, then model performance.
- Reproducible datasets and deterministic preprocessing.
- Keep training/inference concerns separated from product API/UI concerns.
- Measure every milestone with clear acceptance criteria.

## KPI Definitions (Frozen)

1. Data Quality KPI (M2):
  - `cloud_free_ratio >= 0.92`
  - `invalid_tile_ratio <= 0.03`
2. Scale KPI (M2):
  - End-to-end preprocessing throughput `>= 45 MB/s` sustained on `>1TB` runs.
  - Successful resumable completion with `<= 1%` unrecoverable chunk failures.
3. Segmentation KPI (M3):
  - `mIoU >= 0.88`
  - Per-class IoU reported for all land-cover classes.
  - Pixel accuracy tracked per run.
4. Dashboard UX KPI (M5):
  - Initial map-interaction response time `<= 1.5s` at p95.
  - Export success rate (CSV/report/GeoJSON/raster summary) `>= 99%`.
5. Reliability KPI (M4):
  - Workflow stage success rate `>= 98%` with DLQ visibility and retries.

## Milestone Ownership

- M1: Platform Engineering (Owner: Platform Lead)
- M2: Data Engineering (Owner: Data Pipeline Lead)
- M3: ML Engineering (Owner: ML Lead)
- M4: Cloud Platform / SRE (Owner: Cloud Ops Lead)
- M5: Frontend + GIS Product (Owner: Product Engineering Lead)

## Phased Delivery Plan

## Phase 0: Stabilization and Foundations (Weeks 1-3)

### Outcomes
- Production-safe baseline and CI quality gate.
- Architecture split for data, ML, and app responsibilities.

### Workstreams
- Fix critical security and reliability items from legacy audit.
- Add CI pipeline (lint, typecheck, tests, build) and environment templates.
- Create folder architecture for data + ML pipelines.

### Acceptance criteria
- Zero critical security issues open.
- CI required on PRs and passing.
- `docs/ROADMAP.md` and `TODO.md` become source-of-truth planning docs.

## Phase 1: Data Pipeline for Clean Training Data (Weeks 4-8)

### Outcomes
- Automated preprocessing for cloud-masked, normalized, augmented tiles.
- Dataset pipeline validated on pilot region and scaled run.

### Workstreams
- Cloud masking implementation:
  - Sentinel-2 masking policy (SCL/QA-based strategy, configurable thresholds).
  - Quality metrics: cloud coverage ratio per tile and dataset rejection logs.
- Normalization and harmonization:
  - Band-wise normalization strategy (min-max or z-score with persisted stats).
  - Resolution harmonization and reprojection policy.
- Augmentation pipeline:
  - Spatial transforms (flip/rotate/crop), spectral noise/brightness controls.
  - Deterministic seeds for reproducibility.
- Data engineering:
  - Tiling/chunking and metadata manifest generation.
  - Retry-safe and resumable processing for >1TB jobs.

### Acceptance criteria
- End-to-end preprocessing job runs on >=1TB source data.
- Dataset manifest includes provenance and quality stats.
- Re-running with same seed produces reproducible output.

## Phase 2: U-Net Segmentation MVP to Target Accuracy (Weeks 9-14)

### Outcomes
- Land cover segmentation model in place with measurable quality.

### Workstreams
- Build training module for U-Net (baseline encoder-decoder + skip connections).
- Implement train/val/test split and stratified sampling.
- Metrics and evaluation:
  - Primary: mIoU and per-class IoU.
  - Secondary: F1/Dice, pixel accuracy.
- Experimentation:
  - Hyperparameter sweeps (lr, loss, batch size, augmentation policy).
  - Class imbalance handling (weighted loss/focal variants).
- Inference packaging:
  - Model artifact export and inference contract definition.

### Acceptance criteria
- Validation accuracy target >=88% (or equivalent agreed metric with class-level reporting).
- Reproducible training run documented with config + dataset version.
- Inference service returns segmented mask and confidence metadata.

## Phase 3: GCP Serverless Batch and MLOps (Weeks 15-20)

### Outcomes
- Reliable serverless batch orchestration and model lifecycle pipeline.

### Workstreams
- Orchestration stack:
  - Cloud Run Jobs for heavy batch tasks.
  - Pub/Sub for event-driven chaining.
  - Google Workflows for multi-step orchestration and retries.
- Storage and compute:
  - GCS for dataset/model artifacts.
  - Firestore/BigQuery for job status and analytics (as needed).
- Operations:
  - Idempotent job IDs, retries, dead-letter queue.
  - Observability with Cloud Logging + Monitoring + alerting.
- MLOps controls:
  - Dataset and model versioning.
  - Basic model registry and promotion workflow.

### Acceptance criteria
- Automated batch pipeline deploys with IaC and runs unattended.
- Failed stages retry safely; failures are observable and alerting works.
- Inference release process documented with rollback path.

## Phase 4: Advanced GIS Product Layer (Weeks 21-26)

### Outcomes
- Strong GIS dashboard with trend analysis and segmentation overlays.

### Workstreams
- Add map-centric layer (tile overlays, segmentation masks, change heatmaps).
- Time slider for temporal comparison and anomaly visualization.
- Download/export capabilities (CSV/GeoJSON/raster snapshots where applicable).
- Performance optimization for large spatial datasets.
- UX and accessibility improvements for analyst workflows.

### Acceptance criteria
- Dashboard supports region-level and time-range analysis with segmentation overlay.
- Core GIS interactions perform smoothly on target devices.
- Export and share workflows are reliable.

## Cross-Cutting Non-Functional Requirements

- Security: no disabled TLS in production; secrets only via env/secret manager.
- Test strategy:
  - Unit tests for data transforms and model utility functions.
  - Integration tests for pipeline stages and job orchestration.
  - E2E tests for key dashboard workflows.
- Performance SLOs:
  - Batch processing throughput targets for >1TB runs.
  - Inference latency budget for interactive UX.
- Documentation:
  - Runbooks for operations.
  - Data dictionary and model cards.

## Risk Register and Mitigation

- Data quality drift: add quality gate reports and periodic validation.
- Cost overrun on GCP: enforce quotas, budgets, and lifecycle policies.
- Accuracy plateau below target: prioritize class balancing, architecture tuning, and label quality review.
- Operational complexity: codify workflows as IaC and automate checks in CI/CD.

## Milestone Summary

- M1: Secure baseline + CI + architecture split.
- M2: Cloud-masked normalized augmented dataset pipeline at >1TB scale.
- M3: U-Net model with >=88% validation target.
- M4: GCP serverless batch orchestration in production-ready shape.
- M5: GIS dashboard with segmentation and trend intelligence.
