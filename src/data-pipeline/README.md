# Data Pipeline Layer

This module boundary is reserved for dataset engineering and preprocessing workflows.

## Scope
- Satellite data ingestion and tiling
- Cloud masking and quality filters
- Band normalization and harmonization
- Augmentation pipelines
- Dataset manifest generation and versioning

## Rules
- Keep preprocessing deterministic when a seed is supplied.
- Do not mix UI concerns in this layer.
- Emit structured logs for each pipeline stage.

## Commands
- `npm run pipeline:run -- --input data/tiles.json --output artifacts/pipeline`
- `npm run pipeline:benchmark`

## Outputs
- `manifest.json`: Input hash, transform version, policy version, output URI, and cloud coverage per tile.
- `checkpoint.json`: Resume position, processed counters, and failure counters.
- `<datasetId>.normalization.json`: Persisted normalization stats used for reproducible runs.
