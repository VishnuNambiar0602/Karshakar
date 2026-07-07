# Earth Insights TODO (Merged Execution List)

> Updated: 2026-03-10
> Source merge: legacy audit TODO + goal-driven roadmap in `docs/ROADMAP.md`.
> Working rule: execute in order, do not start downstream milestones until blockers are closed.

## 0. Program Alignment

- [x] Confirm final KPI definitions for the five target goals.
- [x] Freeze acceptance metrics:
  - [x] Dataset quality metrics (cloud-free ratio, invalid tile ratio).
  - [x] Scale metric for preprocessing throughput on >1TB workloads.
  - [x] Segmentation quality metric set (mIoU, class IoU, pixel accuracy).
  - [x] Dashboard UX metrics (response time and export success rate).
- [x] Assign owner per milestone in `docs/ROADMAP.md`.

## 1. Critical Blockers (Carryover from Legacy Audit)

### Security and reliability
- [x] Remove/guard all production `rejectUnauthorized: false` usage.
- [x] Harden prompt-input handling against prompt injection in AI flows/tools.
- [x] Keep CSV injection protection and add tests to prevent regressions.
- [x] Prevent API key leakage through URLs and error logs.
- [x] Make Firebase init lazy and fail-safe when credentials are absent.
- [x] Ensure server-only modules are marked and not client-bundled.

### App correctness
- [x] Fix remaining chatbot hook dependency warnings.
- [x] Replace raw `<img>` in payment page with optimized image handling.
- [x] Remove stale/dead comments and remaining dead code paths in actions/flows.
- [x] Add robust error handling for all fire-and-forget async calls.

## 2. Foundation and DevOps (Roadmap Phase 0)

- [x] Add `.env.example` documenting all required variables.
- [x] Add `.nvmrc` and `engines` in `package.json`.
- [x] Add CI pipeline (lint, typecheck, test, build).
- [x] Add test framework baseline (Vitest + Testing Library, or equivalent).
- [x] Add formatter config and pre-commit checks.
- [x] Split architecture folders for `data-pipeline`, `ml`, and `app` concerns.
- [x] Define log strategy (structured logs, levels, correlation IDs).

## 3. Data Pipeline for Clean Dataset Generation (Roadmap Phase 1)

### Cloud masking
- [x] Implement Sentinel-2 cloud masking policy (SCL/QA-based).
- [x] Add cloud coverage scoring per tile.
- [x] Add reject/keep threshold config.

### Normalization and harmonization
- [x] Implement band normalization pipeline with persisted stats.
- [x] Add reprojection/resampling policy and metadata stamps.
- [x] Validate normalization consistency across historical windows.

### Augmentation
- [x] Implement augmentation pipeline (flip/rotate/crop/spectral perturbation).
- [x] Add deterministic seed support for reproducibility.
- [x] Add augmentation policy versioning in manifest.

### Automation and scale (>1TB)
- [x] Build resumable chunked preprocessing jobs.
- [x] Add retry-safe checkpoints and resume-from-last-success.
- [x] Store manifests (input hash, transform version, output URI).
- [x] Benchmark and validate >1TB run completion.

## 4. U-Net Segmentation Delivery (Roadmap Phase 2)

### ML training stack
- [x] Create U-Net training module with configurable encoder depth.
- [x] Add dataset split tooling and class distribution reports.
- [x] Implement class imbalance mitigation (weighted/focal loss options).

### Evaluation and iteration
- [x] Track mIoU and per-class IoU per run.
- [x] Add experiment tracking and reproducible run configs.
- [x] Run hyperparameter sweeps to approach >=88% target.

### Inference integration
- [x] Package model artifact and define inference schema.
- [x] Add post-processing for segmentation masks.
- [x] Wire inference outputs into existing land cover analysis flow.

## 5. Serverless Batch on Google Cloud (Roadmap Phase 3)

- [x] Define GCP architecture for batch orchestration.
- [x] Implement Cloud Run Jobs for heavy preprocessing/training/inference batches.
- [x] Implement Pub/Sub event-driven stage chaining.
- [x] Implement Google Workflows for orchestration and retries.
- [x] Add DLQ and idempotent job keys.
- [x] Add observability: Cloud Logging, Monitoring dashboards, alerts.
- [x] Add cost guardrails (budgets, quotas, lifecycle retention).

## 6. GIS Dashboard Maturity (Roadmap Phase 4)

### Visualization and analysis
- [x] Add map-centric view with segmentation overlay layers.
- [x] Add temporal slider and before/after comparison UX.
- [x] Add anomaly/change heatmap representation.

### Product quality
- [x] Add export options (CSV, report, geospatial artifact where relevant).
- [x] Improve accessibility (aria, reduced motion, keyboard-first flows).
- [x] Improve responsiveness/performance for large datasets.

## 7. Carryover Quality Backlog (Condensed from Legacy TODO)

### AI and flow quality
- [x] Apply Zod parse validation at all flow boundaries.
- [x] Standardize confidence scales across flows.
- [x] Decompose oversized modules (`ai-utils`, `compute-metrics`, `predict/page.tsx`).
- [x] Add timeouts and bounded retries in provider calls.

### Data and state correctness
- [x] Persist dashboard history and chat history across refreshes.
- [x] Persist language preference.
- [x] Replace naive CSV parsing with robust quoted-field parser.

### UI/a11y/performance
- [x] Remove bundle-heavy icon import pattern from weather report.
- [x] Add `prefers-reduced-motion` support for animated backgrounds.
- [x] Improve table responsiveness and sort accessibility.

## 8. Definition of Done per Milestone

- [x] M1 done: no high vulnerabilities open, CI green.
- [x] M2 done: preprocessing pipeline produces clean dataset at >1TB scale.
- [x] M3 done: U-Net reaches agreed >=88% validation target (or agreed equivalent metric).
- [x] M4 done: serverless batch workflows run reliably with observability.
- [x] M5 done: GIS dashboard supports segmentation overlays and trend analysis in production UX.

## 9. Deferred / Nice-to-Have

- [ ] Auth and protected routes completion.
- [ ] Real payment integration.
- [ ] Notification system for monitoring alerts.
- [ ] PWA/offline mode.
- [ ] Admin and usage analytics dashboard.
