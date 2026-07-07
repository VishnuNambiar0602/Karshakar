# Kisan Alert - Smart Farmer Advisory and Satellite Monitoring Portal

Kisan Alert is a production-grade, farmer-first agricultural portal designed to provide real-time soil diagnostics, automated meteorological alerts, and AI-powered crop leaf disease pathology. Powered by the high-performance **Earth Insights** satellite engine, Kisan Alert bridges the gap between complex geospatial data and actionable agricultural advice.

---

## 🌾 Core Capabilities

1. **Interactive 3D Satellite Plot Tracker:** Registers farmer land plots using latitude/longitude and visualizes them as pulsing markers on a mouse-interactive 3D globe reflecting active alert severity ([kisan-globe-3d.tsx](file:///D:/google%20code%20hackathon/Karshakar/src/components/kisan-globe-3d.tsx)).
2. **Automatic Meteorological & Soil Alerts:** Runs evaluations on a 4-hour schedule comparing local crop plots with live sensor records from the Open-Meteo and Soil APIs. Immediately fires alerts for dryness, waterlogging saturation, heatwaves, frost hazards, and flooding risks ([alert-engine.ts](file:///D:/google%20code%20hackathon/Karshakar/src/lib/alert-engine.ts)).
3. **AI Crop Leaf Pathology Scanner:** Uploads photographs of plant leaves to identify pests, diseases, or nutritional deficiencies using **Gemini Vision** (with local mock fallbacks) and provides organic & chemical control remedies ([detect-pest-disease.ts](file:///D:/google%20code%20hackathon/Karshakar/src/ai/flows/detect-pest-disease.ts)).
4. **Text-to-Speech (TTS) Voice Advisories:** Supports low-literacy users and improves accessibility by reading out active alert warnings and diagnostics in their preferred regional languages ([text-to-speech.ts](file:///D:/google%20code%20hackathon/Karshakar/src/ai/flows/text-to-speech.ts)).
5. **Mandi Rates Market Ticker:** Connects to the **data.gov.in Agmarknet API** to surface live regional commodity trading ranges (Wheat, Rice, Cotton, Tomato, Potato, Onion, etc.) per quintal.

---

## 📊 System Architecture & Data Flows

### 1. High-Level System Architecture
The application follows a modular, layered architecture pattern mapping presentation, app logic, core domain intelligence, and serverless operations:

```mermaid
graph TD
    %% Presentation Layer
    subgraph Presentation ["Presentation Layer (Next.js Frontend)"]
        UI["React Dashboard UI"]
        Globe3D["Interactive 3D Globe Canvas"]
        Chatbot["Conversational Assistant"]
    end

    %% Application Layer
    subgraph Application ["Application Layer (Next.js Server Actions)"]
        SA["Server Actions (actions.ts)"]
        JQ["Job Queue / Memory Cache"]
        Auth["Auth & Role Gate (auth.ts)"]
    end

    %% Domain Layer
    subgraph Domain ["Domain & AI Intelligence Layer"]
        Genkit["Google Genkit Flow Engine"]
        LLMChain["Gemini Provider & Fallback Chains"]
        DataPipe["Data Preprocessing (Masking & Norm)"]
        UNet["U-Net Model (Segmentation & Inference)"]
    end

    %% Integration Layer
    subgraph Integration ["Integration & Cloud Infrastructure"]
        Firestore["Cloud Firestore / Fallback JSON DB"]
        GEE["Google Earth Engine API"]
        OpenMeteo["Open-Meteo & Soil API"]
        Mandi["Agmarknet Public API"]
        Twilio["Twilio SMS & Meta WhatsApp APIs"]
    end

    %% Data connections
    UI --> SA
    Globe3D --> SA
    Chatbot --> SA
    SA --> Auth
    Auth --> JQ
    JQ --> Genkit
    JQ --> DataPipe
    Genkit --> LLMChain
    DataPipe --> UNet
    LLMChain --> Firestore
    LLMChain --> Twilio
    UNet --> GEE
    SA --> OpenMeteo
    SA --> Mandi
```

---

### 2. Interactive Advisory Request Flow
This diagram details the sequence triggered when a farmer checks a plot or uploads a crop leaf image:

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer Dashboard
    participant SA as Next.js Server Actions
    participant GEE as Google Earth Engine
    participant Meteo as Open-Meteo / Soil APIs
    participant Genkit as Genkit Flow (Gemini)
    participant TTS as TTS Service
    participant Notify as Twilio / WhatsApp

    Farmer->>SA: Trigger Soil & Crop Analysis (Plot coordinates)
    activate SA
    SA->>GEE: Request Sentinel-2 Spectral Indices (NDVI, NDWI)
    GEE-->>SA: Return computed time-series metrics
    SA->>Meteo: Fetch real-time soil VWC & local forecast
    Meteo-->>SA: Return soil moisture and temperature
    SA->>Genkit: Invoke Crop Advisor / Risk Flow with metrics context
    activate Genkit
    Genkit->>Genkit: Check prompt schemas & run fallback check (Gemini -> Groq)
    Genkit-->>SA: Return structured diagnostic advice & risk alerts
    deactivate Genkit
    alt Critical Risk Detected (High Severity)
        SA->>Notify: Dispatch urgent SMS / WhatsApp alert
    end
    SA-->>Farmer: Return metrics, active alerts, and advisories
    deactivate SA

    Farmer->>SA: Request audio playback (Regional voice advisory)
    activate SA
    SA->>TTS: Invoke Text-to-Speech Flow
    TTS-->>SA: Return base64-encoded audio data URI
    SA-->>Farmer: Stream audio clip
    deactivate SA
    Note over Farmer: Audio plays in selected language (Hindi, Punjabi, Tamil, etc.)
```

---

### 3. Serverless Preprocessing & MLOps Batch Pipeline (Phase 3 Backend)
For large-scale dataset generation, model training, validation, and automated promotion:

```mermaid
graph LR
    %% Scheduler
    Trigger["Cloud Scheduler (Cron)"] --> Workflows["Google Cloud Workflows (Orchestrator)"]

    subgraph Pipeline ["Serverless Batch Jobs (Cloud Run Jobs)"]
        Preprocess["1. Preprocess Job (ei-preprocess-job)"]
        Train["2. Train Job (ei-train-job)"]
        Inference["3. Inference Job (ei-inference-job)"]
        Promote["4. Promote Job (ei-promote-job)"]
    end

    subgraph Storage ["Cloud Storage & Registry"]
        GCS_Data["GCS Bucket: Preprocessed Tiles"]
        GCS_Model["GCS Bucket: Model Artifacts"]
        Registry["Model Registry (candidate -> production)"]
    end

    %% Execution flow
    Workflows -->|Trigger| Preprocess
    Preprocess -->|Write clean tiles| GCS_Data
    GCS_Data --> Train
    Train -->|Write candidate weights| GCS_Model
    GCS_Model --> Inference
    Inference -->|Evaluate mIoU >= 88%| Promote
    Promote -->|Advance Release Pointer| Registry

    %% Error path
    Preprocess -.->|On Failure| DLQ["Dead-Letter Queue (Pub/Sub)"]
    Train -.->|On Failure| DLQ
    Inference -.->|On Failure| DLQ
    DLQ --> Alerting["Cloud Monitoring Alert Trigger"]
```

---

## 🛠️ Technology Stack

*   **Application Framework:** Next.js 15 (using App Router, Server Actions, React 18, and TypeScript)
*   **Styling & UI:** Tailwind CSS, Radix UI Primitives, Recharts (for charts), Lucide React (icons)
*   **AI Orchestration:** Google Genkit + Google Gemini (with Groq, Mistral, and HuggingFace API fallback chains)
*   **Database:** Firestore (Firebase Admin SDK) with a local JSON file-based database fallback (`kisan-alert-db.json`)
*   **Orchestration Backend:** GCP Cloud Run, Pub/Sub, Cloud Workflows, Cloud Logging/Monitoring
*   **Testing & Quality:** Vitest (unit/integration tests), Playwright (E2E tests), ESLint (linting), Prettier (formatting)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (version `>=24.11.1 <25` specified in `.nvmrc`)
*   npm (pre-packaged with Node)

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to create your local environment variables:
```bash
cp .env.example .env
```

> [!IMPORTANT]
> The application will look for `GOOGLE_APPLICATION_CREDENTIALS_JSON` inside `.env`. 
> If this environment variable is missing, the system will **automatically run in local sandbox mode**, using a local file database ([kisan-alert-db.json](file:///D:/google%20code%20hackathon/Karshakar/kisan-alert-db.json)) and mocked AI provider fallbacks. This allows local front-end debugging without needing cloud keys.

Fill out the variables inside `.env`:
*   `GEMINI_API_KEY` / `GOOGLE_GENAI_API_KEY`: Primary Gemini API keys for AI advisor diagnostics.
*   `GROQ_API_KEY` / `MISTRAL_API_KEY` / `HUGGINGFACE_API_KEY`: Fallback API keys to prevent downtime.
*   `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Single-line JSON string representing GCP credentials.
*   `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`: Twilio SMS and WhatsApp endpoints for active alerts.
*   `CRON_SECRET`: Access key to protect the `/api/cron/run-alerts` alert scheduling route.
*   `DATA_GOV_IN_API_KEY`: Key to retrieve live Agmarknet mandi rates.

### 3. Local Development Run
Start the Next.js local development server (runs on port `9003` by default):
```bash
npm run dev
```

Start the Google Genkit UI console for testing prompts and flows:
```bash
npm run genkit:dev
```

---

## 🧪 Testing & Verification

The codebase includes a comprehensive suite of unit tests, contract validations, and formatting checks. Run them before proposing changes:

```bash
# Run unit & integration tests (Vitest)
npm run test

# Run ESLint check
npm run lint

# Run ESLint automatic fixing
npm run lint:fix

# Run TypeScript typechecks
npm run typecheck

# Run Playwright E2E browser tests
npm run test:e2e
```

> [!TIP]
> Tests are configured to automatically bypass external AI API calls if keys are absent, logging warnings and exiting cleanly rather than failing mock checks.

---

## ☁️ Production Deployment

### 1. Frontend & Portal
The Next.js portal is configured to be hosted on **Firebase App Hosting** or **Vercel** with Next.js Server Actions handling database writes.
To build the application bundle locally:
```bash
npm run build
```

### 2. GCP Serverless Pipelines (Phase 3 Backend)
The backend pipeline for geospatial preprocessing and ML training is defined under `infra/gcp/`.
To execute simulations or trigger manual stages:
```bash
# Run local simulation of the GCP pipeline
npm run gcp:phase3

# Execute benchmark data pipeline tiling tests
npm run pipeline:benchmark

# Execute ML training loop simulation tests
npm run ml:phase2:test
```

Production serverless definitions are structured as follows:
*   **Workflows:** [infra/gcp/workflows/batch-orchestrator.yaml](file:///D:/google%20code%20hackathon/Karshakar/infra/gcp/workflows/batch-orchestrator.yaml) handles stage execution.
*   **Budgets:** [infra/gcp/budgets/budget.json](file:///D:/google%20code%20hackathon/Karshakar/infra/gcp/budgets/budget.json) handles cost guardrails.
*   **Monitoring:** [infra/gcp/monitoring/alerts.json](file:///D:/google%20code%20hackathon/Karshakar/infra/gcp/monitoring/alerts.json) sets up SLO notifications.
