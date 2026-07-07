# Logging Strategy

> Purpose: Provide a single logging pattern for app, pipeline, and ML modules.

## Principles
- Use structured JSON logs in server-side code.
- Keep client-side logs minimal and non-sensitive.
- Never log secrets, credentials, or raw auth headers.
- Include context fields for traceability.

## Required Fields
- `ts`: ISO timestamp
- `level`: `debug | info | warn | error`
- `message`: short event description
- `scope`: module area (for example `ai.providers`, `data-pipeline.ingest`)
- `requestId`: correlation id if available

## Log Levels
- `debug`: verbose diagnostics, disabled in production by default.
- `info`: lifecycle events and successful stage completions.
- `warn`: recoverable issues and retries.
- `error`: failed operations with safe error metadata.

## Runtime Behavior
- Development: `LOG_LEVEL=debug`
- Production default: `LOG_LEVEL=info`
- Override with env var `LOG_LEVEL`

## Implementation
- Use `src/lib/logger.ts` helper methods (`debug`, `info`, `warn`, `error`).
- Pass contextual metadata object as second argument.
