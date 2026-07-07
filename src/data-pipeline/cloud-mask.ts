import type { CloudMaskPolicy, CloudMaskResult, SpectralTile } from './types';

const QA60_CLOUD_BIT = 10;
const QA60_CIRRUS_BIT = 11;

export const defaultCloudMaskPolicy: CloudMaskPolicy = {
  useSCL: true,
  useQA60: true,
  maxCloudCoverage: 0.35,
  cloudScoreThreshold: 0.65,
  keepSCLClasses: [4, 5, 6, 7, 11],
};

function isCloudByQA60(value: number): boolean {
  const cloud = (value & (1 << QA60_CLOUD_BIT)) !== 0;
  const cirrus = (value & (1 << QA60_CIRRUS_BIT)) !== 0;
  return cloud || cirrus;
}

function isCloudBySCL(scl: number, keepSCLClasses: number[]): boolean {
  return !keepSCLClasses.includes(scl);
}

function computeCloudFlags(tile: SpectralTile, policy: CloudMaskPolicy): boolean[] {
  const anyBand = Object.values(tile.bands)[0] ?? [];
  const totalPixels = anyBand.length;
  const flags = new Array<boolean>(totalPixels).fill(false);

  for (let i = 0; i < totalPixels; i++) {
    let cloudy = false;

    if (policy.useSCL && tile.scl && i < tile.scl.length) {
      cloudy = cloudy || isCloudBySCL(tile.scl[i], policy.keepSCLClasses);
    }

    if (policy.useQA60 && tile.qa60 && i < tile.qa60.length) {
      cloudy = cloudy || isCloudByQA60(tile.qa60[i]);
    }

    flags[i] = cloudy;
  }

  return flags;
}

export function applyCloudMask(tile: SpectralTile, policy: CloudMaskPolicy = defaultCloudMaskPolicy): CloudMaskResult {
  const cloudFlags = computeCloudFlags(tile, policy);
  const totalPixels = cloudFlags.length;
  const cloudPixels = cloudFlags.filter(Boolean).length;
  const cloudCoverageRatio = totalPixels === 0 ? 0 : cloudPixels / totalPixels;
  const cloudScore = 1 - cloudCoverageRatio;

  const maskedBands: SpectralTile['bands'] = {};
  for (const [band, values] of Object.entries(tile.bands)) {
    maskedBands[band] = values.map((value, index) => (cloudFlags[index] ? Number.NaN : value));
  }

  const keep = cloudCoverageRatio <= policy.maxCloudCoverage && cloudScore >= policy.cloudScoreThreshold;

  return {
    maskedTile: {
      ...tile,
      bands: maskedBands,
      metadata: {
        ...tile.metadata,
        cloudCoverageRatio,
        cloudScore,
      },
    },
    cloudCoverageRatio,
    cloudScore,
    keep,
    totalPixels,
    cloudPixels,
  };
}
