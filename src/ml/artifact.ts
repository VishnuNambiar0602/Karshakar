import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { ExperimentRun, ModelArtifact } from './types';

export const ModelArtifactSchema = z.object({
  modelId: z.string(),
  version: z.string(),
  createdAt: z.string(),
  datasetVersion: z.string(),
  configHash: z.string(),
  encoderDepth: z.number(),
  numClasses: z.number(),
  classNames: z.array(z.string()),
  validationMetrics: z.object({
    mIoU: z.number(),
    pixelAccuracy: z.number(),
    perClass: z.object({
      iou: z.record(z.string(), z.number()),
      dice: z.record(z.string(), z.number()),
    }),
  }),
  inferenceSchemaVersion: z.string(),
});

export function packageModelArtifact(run: ExperimentRun, version: string): ModelArtifact {
  return {
    modelId: run.modelConfig.modelId,
    version,
    createdAt: new Date().toISOString(),
    datasetVersion: run.datasetVersion,
    configHash: run.configHash,
    encoderDepth: run.modelConfig.encoderDepth,
    numClasses: run.modelConfig.numClasses,
    classNames: ['other', 'vegetation', 'builtUp', 'water'],
    validationMetrics: run.bestMetrics,
    inferenceSchemaVersion: 'segmentation-inference-v1',
  };
}

export async function persistModelArtifact(filePath: string, artifact: ModelArtifact): Promise<void> {
  const validated = ModelArtifactSchema.parse(artifact);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(validated, null, 2), 'utf8');
}

export async function loadModelArtifact(filePath: string): Promise<ModelArtifact> {
  const content = await fs.readFile(filePath, 'utf8');
  return ModelArtifactSchema.parse(JSON.parse(content));
}
