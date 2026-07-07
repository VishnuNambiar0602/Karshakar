# ML Layer

This module boundary is reserved for model training, evaluation, and inference logic.

## Scope
- Model architecture definitions (for example U-Net)
- Training loops and experiment configs
- Evaluation metrics and reports
- Model artifact packaging
- Inference adapters consumed by app services

## Rules
- Keep data access abstracted through pipeline manifests.
- Track metrics by dataset and model version.
- Ensure reproducibility for every promoted model artifact.

## Phase 2 Commands
- `npm run ml:phase2 -- --output artifacts/ml-phase2`
- `npm run ml:phase2:test`

## Phase 2 Outputs
- `experiments.json`: reproducible run configs and epoch metrics.
- `models/unet-landcover-v1.json`: packaged model artifact + inference contract.
- `sweep-summary.json`: target tracking for >=88% mIoU goal.
