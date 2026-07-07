import type { LossStrategy } from './types';

export function computeClassWeights(classPixelCounts: Record<number, number>): number[] {
  const entries = Object.entries(classPixelCounts);
  if (entries.length === 0) {
    return [];
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const rawWeights = entries.map(([, count]) => (count === 0 ? 0 : total / count));
  const weightSum = rawWeights.reduce((sum, w) => sum + w, 0);

  return rawWeights.map((w) => (weightSum === 0 ? 0 : w / weightSum));
}

export function resolveLossConfig(
  strategy: LossStrategy,
  classWeights: number[] | undefined,
  focalGamma: number | undefined
): { strategy: LossStrategy; classWeights?: number[]; focalGamma?: number } {
  if (strategy === 'focal') {
    return {
      strategy,
      classWeights,
      focalGamma: focalGamma ?? 2,
    };
  }

  return {
    strategy,
    classWeights,
  };
}
