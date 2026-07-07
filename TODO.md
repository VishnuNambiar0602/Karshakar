# Kisan Alert - Smart Farmer Advisory Roadmap

> Updated: 2026-07-07
> Status: Roadmap Completed

This list tracks the implementation phases for the Kisan Alert smart farmer portal.

## Phase 1: Real Farmer UI & Frontend Wiring
- [x] Create `/onboarding` page for farmer registration profile config.
- [x] Create `/plots` management page with 3D Globe visualization.
- [x] Create `/alerts` center with severity groupings and manual check trigger.
- [x] Create `/pest-check` AI Crop Leaf Pathology scanner with organic/chemical remedies.
- [x] Replace global landing page (`src/app/page.tsx`) with farmer dashboard.
- [x] Integrate global Header navigation pointing to the new subpages.
- [x] Connect text-to-speech (TTS) voice advisories to alerts and pathology diagnosis.

## Phase 2: Automatic Alert Scheduling
- [x] Create `/api/cron/run-alerts` route with `CRON_SECRET` protection.
- [x] Add Vercel Cron (`vercel.json`) scheduler configuration.
- [x] Implement `NotificationLog` collection schema in `kisan-store.ts`.
- [x] Track SMS/WhatsApp delivery status and surface it on `/alerts`.

## Phase 3: Verified OTP Phone Authentication
- [x] Replace auth stubs in `src/lib/auth.ts` with real phone/OTP session verification.
- [x] Build `/login` user interface and protect farmer pages behind session checks.
- [x] Rename `earth_insights_*` cookie and header keys to `kisan_alert_*`.
- [x] Enforce production-level `AUTH_REQUIRED` verification.

## Phase 4: Locale Parity & Indian Mandi Rates API
- [x] Build key-parity verification tests in `src/test/locales.test.ts` for all translation JSONs.
- [x] Clean and synchronize missing translation keys across all regional files (ML, MR, OR, PA, etc.).
- [x] Integrate data.gov.in Agmarknet API (or equivalent public API) in `src/services/mandi.ts` with fallback logic.

## Phase 5: Rebranding & Checkout Decision
- [x] Rename Next.js app `"nextn"` to `"kisan-alert"` in `package.json`.
- [x] Rewrite `README.md` to focus on Kisan Alert capabilities.
- [x] Populate `.env.example` with twilio, whatsapp, cron-secret, and mandi api variables.
- [x] Resolve Mock payment page: remove fake purchase success and clarify MVP free tier.

## Phase 6: Admin Advisory Analytics Dashboard
- [x] Build `/admin` route showing total farmers, plot volume, alert rates, and delivery logs.
- [x] Protect `/admin` route under the `admin` role restriction.
