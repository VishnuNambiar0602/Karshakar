import { z } from 'zod';
import type { ModelArtifact, SegmentationInferenceInput, SegmentationInferenceOutput } from './types';

export const SegmentationInferenceInputSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  features: z.object({
    vegetationRatio: z.number(),
    waterRatio: z.number(),
    builtUpRatio: z.number(),
    otherRatio: z.number(),
    ndvi: z.number(),
    ndwi: z.number(),
    ndbi: z.number(),
    nbr: z.number(),
  }),
});

function normalize(values: number[]): number[] {
  const clipped = values.map((value) => Math.max(0, value));
  const sum = clipped.reduce((acc, value) => acc + value, 0);
  if (sum === 0) {
    return new Array(values.length).fill(1 / values.length);
  }
  return clipped.map((value) => value / sum);
}

function argmax(values: number[]): number {
  let maxIndex = 0;
  let maxValue = values[0] ?? Number.NEGATIVE_INFINITY;
  for (let i = 1; i < values.length; i++) {
    if ((values[i] ?? Number.NEGATIVE_INFINITY) > maxValue) {
      maxValue = values[i] ?? Number.NEGATIVE_INFINITY;
      maxIndex = i;
    }
  }
  return maxIndex;
}

function postProcessMajority(mask: number[], width: number, height: number): { smoothed: number[]; isolatedPixelFixes: number } {
  const out = [...mask];
  let fixes = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const votes: Record<number, number> = {};

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const classId = mask[(y + dy) * width + (x + dx)] ?? 0;
          votes[classId] = (votes[classId] ?? 0) + 1;
        }
      }

      const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
      const majorityClass = Number(sortedVotes[0]?.[0] ?? out[idx]);

      if (majorityClass !== out[idx] && (votes[out[idx]] ?? 0) <= 2) {
        out[idx] = majorityClass;
        fixes += 1;
      }
    }
  }

  return { smoothed: out, isolatedPixelFixes: fixes };
}

export function runSegmentationInference(
  rawInput: SegmentationInferenceInput,
  artifact: ModelArtifact
): SegmentationInferenceOutput {
  const input = SegmentationInferenceInputSchema.parse(rawInput);
  const total = input.width * input.height;

  const base = normalize([
    input.features.otherRatio,
    input.features.vegetationRatio + Math.max(input.features.ndvi, 0) * 0.15,
    input.features.builtUpRatio + Math.max(input.features.ndbi, 0) * 0.15,
    input.features.waterRatio + Math.max(input.features.ndwi, 0) * 0.15,
  ]);

  const mask: number[] = [];
  const classProbTotals = [0, 0, 0, 0];
  let confidenceTotal = 0;

  for (let idx = 0; idx < total; idx++) {
    const x = idx % input.width;
    const y = Math.floor(idx / input.width);
    const spatialTerm = ((x * 31 + y * 17 + artifact.encoderDepth * 13) % 100) / 1000;

    const probs = normalize([
      base[0] + spatialTerm,
      base[1] + (x / input.width) * 0.02,
      base[2] + (y / input.height) * 0.02,
      base[3] + ((x + y) / (input.width + input.height)) * 0.02,
    ]);

    const pred = argmax(probs);
    mask.push(pred);
    confidenceTotal += probs[pred] ?? 0;
    for (let i = 0; i < probs.length; i++) {
      classProbTotals[i] += probs[i] ?? 0;
    }
  }

  const post = postProcessMajority(mask, input.width, input.height);

  return {
    mask: post.smoothed,
    width: input.width,
    height: input.height,
    meanConfidence: confidenceTotal / total,
    classConfidence: {
      other: classProbTotals[0] / total,
      vegetation: classProbTotals[1] / total,
      builtUp: classProbTotals[2] / total,
      water: classProbTotals[3] / total,
    },
    postProcessing: {
      smoothingKernel: 3,
      isolatedPixelFixes: post.isolatedPixelFixes,
    },
    model: {
      modelId: artifact.modelId,
      version: artifact.version,
      configHash: artifact.configHash,
    },
  };
}
