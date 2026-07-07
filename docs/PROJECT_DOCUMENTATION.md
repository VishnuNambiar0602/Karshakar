# Earth Insights Analysis Platform - Comprehensive Documentation

## 1. Project Overview

Earth Insights is a full-stack geospatial intelligence platform built on Next.js that combines satellite data, weather context, and AI reasoning to support environmental monitoring and agriculture-oriented decision support.

The platform currently includes:
- Interactive analytics dashboards for land and vegetation metrics.
- AI-assisted prediction and advisory workflows.
- A modular data-pipeline layer for large-scale satellite preprocessing.
- An ML layer for land-cover segmentation (U-Net workflow and artifacts).
- A GCP serverless orchestration layer for scalable batch pipelines.

---

## 2. Core Feature Set

### 2.1 Dashboard and Geospatial Analysis
Primary interface: `src/components/dashboard.tsx`

Key capabilities:
- Region/time-range based metrics computation via asynchronous jobs.
- Land-cover and change analysis visualization.
- GIS dashboard with map-centric overlays and temporal exploration.
- Weather integration for contextual interpretation.
- Historical analysis persistence (dashboard + chat history).
- CSV/report export-oriented analysis flows.

### 2.2 GIS Dashboard (Phase 4)
Primary interface: `src/components/gis-dashboard.tsx`  
Reference doc: `docs/GIS_DASHBOARD_PHASE4.md`

Implemented:
- Segmentation overlays.
- Before/after slider comparison.
- Temporal slider + anomaly heatmap view.
- Export support (CSV/report/GeoJSON/raster-summary).
- Accessibility improvements (`aria-*`, keyboard flow, reduced motion support).

### 2.3 Prediction Workspace
Page: `src/app/predict/page.tsx`

AI-assisted predictions include:
- Coordinate suggestion from location text.
- Weather report generation.
- Crop planning suggestions.
- Irrigation scheduling.
- Soil moisture prediction.
- Crop yield prediction (crop-selective).
- Drought/flood risk analysis.
- Scenario-based impact analysis.

### 2.4 Crop Advisor Workspace
Page: `src/app/crop-advisor/page.tsx`

Features:
- Recommended crop by location, climate description, and current crop.
- Suitability score and reasoning.
- Advanced agronomic advice for selected crop.
- Soil type and moisture-informed recommendation context.

### 2.5 Conversational Assistant
Primary interface: `src/components/chatbot.tsx`

Features:
- LLM-based conversational assistance tied to selected coordinates.
- Integration with server actions and AI flow orchestration.
- User history support to persist interactions.

### 2.6 Internationalization
- Locale files under `src/locales/*.json`.
- Language switching via `use-language.tsx` and UI language switcher.
- Supports multiple Indian and global languages out of the box.

### 2.7 User Settings and Preferences
- Preferences and history persisted through server actions and user store utilities.
- Settings page for user-level controls (`src/app/settings/page.tsx`).

### 2.8 Platform/Commercial Stubs
- Pricing and payment pages are present.
- Payment flow currently represents a product scaffold, not a complete billing backend.

---

## 3. Technical Stack

### 3.1 Application and UI
- Framework: **Next.js 15** (App Router)
- Runtime: **Node.js** (engine: `>=24.11.1 <25`)
- Language: **TypeScript**
- UI: **React 18**, **Tailwind CSS**, **Radix UI**, **Recharts**

### 3.2 AI and LLM Orchestration
- Orchestration framework: **Google Genkit**
- Primary model provider: **Google Gemini**
- Fallback providers: **Groq**, **Mistral**, **HuggingFace**
- AI logic organized under `src/ai/flows` and `src/ai/tools`

### 3.3 Geospatial and External Data
- Geospatial engine: **Google Earth Engine**
- Weather and environmental context: **Open-Meteo** service integration
- Optional backend integration foundation: **Firebase Admin SDK**

### 3.4 Testing and Quality Tooling
- Unit/integration tests: **Vitest**
- E2E tests: **Playwright**
- Linting: **ESLint**
- Formatting: **Prettier**
- Git hook checks: **Husky + lint-staged**

### 3.5 Infrastructure and Cloud Ops
- GCP serverless architecture artifacts under `infra/gcp`
- Components: Cloud Run Jobs, Pub/Sub, Workflows, Monitoring, budgets/guardrails

---

## 4. Repository Structure and Module Responsibilities

- `src/app` - App routes and page composition.
- `src/components` - UI components, dashboards, dialogs, and domain widgets.
- `src/lib` - Server actions, utility libraries, security helpers, user state/job queue handling.
- `src/ai` - AI flows, provider routing, prompt governance, cache/rate-limiter logic.
- `src/data-pipeline` - Dataset preprocessing (masking, normalization, augmentation, manifest/checkpointing).
- `src/ml` - ML training/evaluation/inference artifact logic.
- `src/gcp-orchestration` - Workflow orchestration, retries, idempotency, DLQ, cost guardrails.
- `docs` - Architecture, roadmap, observability, and operational documents.
- `infra/gcp` - Deployable IaC-like configuration references for serverless batch architecture.

---

## 5. System Design and Architecture

### 5.1 High-Level Architecture

The system follows a modular layered architecture:

1. **Presentation Layer** (Next.js pages + React components)
   - Captures user input and renders analytics/prediction outputs.
2. **Application Layer** (server actions in `src/lib/actions.ts`)
   - Coordinates asynchronous jobs, access control checks, and request validation.
3. **Domain Intelligence Layer** (`src/ai`, `src/data-pipeline`, `src/ml`)
   - Computes geospatial metrics, invokes LLM flows, runs ML pipelines.
4. **Integration Layer**
   - Earth Engine, Open-Meteo, AI model providers, Firebase/GCP services.
5. **Operations Layer** (`src/gcp-orchestration`, `infra/gcp`)
   - Batch orchestration, retries, observability, DLQ, and budget guardrails.

### 5.2 Primary Runtime Flow (Interactive Request)

1. User submits coordinates/date range from dashboard/predict pages.
2. Server action validates input and starts/queries a computation job.
3. Geospatial metrics and auxiliary data are fetched/derived.
4. AI flows transform raw metrics into recommendations/insights.
5. UI renders metrics, maps, summaries, and optional chatbot context.
6. User interactions may be persisted as history/preferences.

### 5.3 Batch/Serverless Pipeline Flow (Phase 3)

Reference: `docs/GCP_SERVERLESS_ARCHITECTURE.md`

1. **Preprocess** stage prepares cloud-masked normalized datasets.
2. **Train** stage produces model candidates and experiment metadata.
3. **Inference validation** checks serving contract behavior.
4. **Promote** stage updates model registry state/version pointer.
5. Retries, DLQ routing, and monitoring policies govern failure handling.

### 5.4 Reliability, Security, and Guardrails

Implemented design patterns include:
- Structured logging and observability-oriented scopes.
- Retry logic with exponential backoff.
- Idempotency in orchestration and job-style operations.
- Prompt-governance and schema validation at flow boundaries.
- Server-side secret handling through environment variables.
- Guardrails for cost/budget and daily run quotas in GCP orchestration.

---

## 6. Existing Documentation Index

- Core architecture: `docs/ARCHITECTURE.md`
- Serverless batch architecture: `docs/GCP_SERVERLESS_ARCHITECTURE.md`
- GIS phase details: `docs/GIS_DASHBOARD_PHASE4.md`
- Roadmap and milestones: `docs/ROADMAP.md`
- Logging strategy: `docs/LOGGING.md`
- Observability guidance: `docs/OBSERVABILITY.md`
- Phase runbook: `docs/PHASE3_RUNBOOK.md`
- Data pipeline module: `src/data-pipeline/README.md`
- ML module: `src/ml/README.md`
- GCP orchestration module: `src/gcp-orchestration/README.md`

---

## 7. Local Development and Validation

### 7.1 Environment Setup

1. Use Node version from `.nvmrc`.
2. Copy `.env.example` values into a local `.env` file.
3. Provide API keys and credentials for Earth Engine, AI providers, and optional GCP orchestration.

### 7.2 Core Commands

- Install dependencies: `npm ci`
- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Tests: `npm run test`
- Build: `npm run build`
- E2E tests: `npm run test:e2e`

Domain-specific commands:
- Data pipeline run: `npm run pipeline:run`
- Data pipeline benchmark tests: `npm run pipeline:benchmark`
- ML phase run: `npm run ml:phase2`
- ML tests: `npm run ml:phase2:test`
- GCP orchestration phase run: `npm run gcp:phase3`
- GCP orchestration tests: `npm run gcp:phase3:test`

---

## 8. Improvement Opportunities

### 8.1 Product and Feature Improvements

1. Complete authentication and protected-route strategy (currently listed as deferred).
2. Implement production-grade payments and subscription management.
3. Add notification channels (email/SMS/in-app) for risk alerts and pipeline events.
4. Provide richer GIS interaction tools (custom layers, annotations, collaboration sharing).
5. Expand report exports to standards used by government/enterprise GIS workflows.

### 8.2 Architecture and Scalability Improvements

1. Introduce stricter bounded contexts between UI/app/domain layers for long-term maintainability.
2. Add asynchronous event-driven orchestration for all heavy interactive jobs (not only phase pipelines).
3. Separate AI provider orchestration into a dedicated service boundary for easier scaling/quotas.
4. Formalize model registry lifecycle (staging/canary/production) with policy-based promotion.
5. Add tenant-aware design if multi-organization usage is expected.

### 8.3 Data and ML Improvements

1. Add full data catalog and lineage tracking for datasets/manifests.
2. Introduce drift detection and scheduled model re-evaluation.
3. Add model card generation and explainability artifacts for each promoted model.
4. Expand quality gates for label consistency and geospatial anomaly detection.
5. Add benchmark datasets and confidence calibration reporting in CI.

### 8.4 Security and Compliance Improvements

1. Add centralized secret manager integration and rotation policy automation.
2. Add stronger runtime authorization checks for sensitive server actions.
3. Add threat-model documentation and recurring security review cadence.
4. Add audit trails for model promotion, user-sensitive actions, and admin workflows.
5. Add compliance mapping (data retention, residency, and privacy controls) for production readiness.

### 8.5 Testing and Quality Improvements

1. Expand E2E coverage for full dashboard and prediction user journeys.
2. Add contract tests for external provider adapters (Earth Engine/Open-Meteo/LLM providers).
3. Add performance regression tests for GIS rendering and high-volume metric timelines.
4. Add chaos/failure-injection tests for orchestration retry and DLQ behavior.
5. Add accessibility test automation integrated into CI.

### 8.6 DevOps and Operations Improvements

1. Add deployment environment strategy (dev/staging/prod) with policy checks.
2. Add SLO error-budget dashboards and automated rollback triggers.
3. Expand infrastructure-as-code maturity and deployment automation coverage.
4. Add cost anomaly detection and proactive optimization recommendations.
5. Add runbook drills and incident simulation for operational readiness.

---

## 9. Current Known Constraints / Gaps

- Production build may fail in restricted-network environments when Google Fonts cannot be reached.
- Some product areas (authentication completion, payments, notifications, admin analytics, offline/PWA) remain deferred in `TODO.md`.
- Final production hardening depends on environment-specific credentials and cloud configuration.

---

## 10. Suggested Next Documentation Additions

To further improve this documentation set, add:
- API/server action reference by endpoint contract.
- Sequence diagrams for each major user workflow.
- Data dictionary for all metrics and indices.
- Incident response handbook mapped to alerts.
- Release checklist for model and app deployment.
