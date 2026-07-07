import type { ClassDistributionReport, DatasetSample, DatasetSplit } from './types';

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function stratifiedSplitDataset(
  samples: DatasetSample[],
  seed: number,
  ratios: { train: number; validation: number; test: number } = { train: 0.7, validation: 0.15, test: 0.15 }
): DatasetSplit {
  const buckets = new Map<number, DatasetSample[]>();
  for (const sample of samples) {
    const bucket = buckets.get(sample.dominantClass) ?? [];
    bucket.push(sample);
    buckets.set(sample.dominantClass, bucket);
  }

  const split: DatasetSplit = { train: [], validation: [], test: [] };

  for (const [classId, classSamples] of buckets.entries()) {
    const shuffled = shuffleInPlace([...classSamples], seed + classId);
    const trainEnd = Math.floor(shuffled.length * ratios.train);
    const validationEnd = trainEnd + Math.floor(shuffled.length * ratios.validation);

    split.train.push(...shuffled.slice(0, trainEnd));
    split.validation.push(...shuffled.slice(trainEnd, validationEnd));
    split.test.push(...shuffled.slice(validationEnd));
  }

  return {
    train: shuffleInPlace(split.train, seed + 101),
    validation: shuffleInPlace(split.validation, seed + 202),
    test: shuffleInPlace(split.test, seed + 303),
  };
}

function distributionForSplit(splitName: ClassDistributionReport['splitName'], samples: DatasetSample[]): ClassDistributionReport {
  const classPixelCounts: Record<number, number> = {};
  let total = 0;

  for (const sample of samples) {
    for (const pixelClass of sample.labelMask) {
      classPixelCounts[pixelClass] = (classPixelCounts[pixelClass] ?? 0) + 1;
      total += 1;
    }
  }

  const classPixelRatios: Record<number, number> = {};
  for (const [classId, count] of Object.entries(classPixelCounts)) {
    classPixelRatios[Number(classId)] = total === 0 ? 0 : count / total;
  }

  return {
    splitName,
    sampleCount: samples.length,
    classPixelCounts,
    classPixelRatios,
  };
}

export function buildClassDistributionReports(split: DatasetSplit): ClassDistributionReport[] {
  return [
    distributionForSplit('train', split.train),
    distributionForSplit('validation', split.validation),
    distributionForSplit('test', split.test),
    distributionForSplit('all', [...split.train, ...split.validation, ...split.test]),
  ];
}
