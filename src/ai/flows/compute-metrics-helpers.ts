import type { DatasetSplit } from '@/ml';

export function getPercentageChange(start: number, end: number): number {
  if (start === 0) {
    return end > 0 ? 100.0 : 0.0;
  }

  const result = ((end - start) / Math.abs(start)) * 100;
  return Math.min(Math.max(result, -1000000), 1000000);
}

export function latestMetricValue(series: Array<{ value: number | null }>): number {
  const latest = series[series.length - 1]?.value;
  return typeof latest === 'number' && Number.isFinite(latest) ? latest : 0;
}

export function buildSyntheticSplitFromLandCover(
  landCover: {
    vegetation: { endArea: number };
    water: { endArea: number };
    builtUp: { endArea: number };
    other: { endArea: number };
  },
  ndvi: number,
  ndwi: number,
  ndbi: number,
  nbr: number
): DatasetSplit {
  const samples = new Array(24).fill(null).map((_, idx) => {
    const dominantClass = idx % 4;
    return {
      id: `synthetic-${idx}`,
      dominantClass,
      features: [
        landCover.vegetation.endArea,
        landCover.water.endArea,
        landCover.builtUp.endArea,
        landCover.other.endArea,
        ndvi,
        ndwi,
        ndbi,
        nbr,
      ],
      labelMask: new Array(256).fill(dominantClass),
    };
  });

  return {
    train: samples.slice(0, 16),
    validation: samples.slice(16, 20),
    test: samples.slice(20),
  };
}
