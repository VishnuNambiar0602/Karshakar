import type { AugmentationPolicy, SpectralTile } from './types';

const DEFAULT_ROTATIONS: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

export const defaultAugmentationPolicy: AugmentationPolicy = {
  version: 'v1',
  seed: 20260310,
  flipHorizontal: true,
  flipVertical: false,
  rotations: DEFAULT_ROTATIONS,
  cropScaleRange: [0.85, 1],
  brightnessJitter: 0.08,
  spectralNoiseStd: 0.01,
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  const u = Math.max(rand(), Number.EPSILON);
  const v = Math.max(rand(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function applyPermutation(values: number[], permutation: number[]): number[] {
  return permutation.map((index) => values[index]);
}

function rotatePermutation(width: number, height: number, degrees: 0 | 90 | 180 | 270): number[] {
  const permutation: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let srcX = x;
      let srcY = y;

      if (degrees === 90) {
        srcX = y;
        srcY = width - 1 - x;
      } else if (degrees === 180) {
        srcX = width - 1 - x;
        srcY = height - 1 - y;
      } else if (degrees === 270) {
        srcX = height - 1 - y;
        srcY = x;
      }

      srcX = Math.max(0, Math.min(width - 1, srcX));
      srcY = Math.max(0, Math.min(height - 1, srcY));
      const srcIndex = srcY * width + srcX;
      permutation.push(srcIndex);
    }
  }

  return permutation;
}

function flipPermutation(width: number, height: number, horizontal: boolean, vertical: boolean): number[] {
  const permutation: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = horizontal ? width - 1 - x : x;
      const srcY = vertical ? height - 1 - y : y;
      permutation.push(srcY * width + srcX);
    }
  }

  return permutation;
}

function cropMask(width: number, height: number, scale: number): boolean[] {
  const cropW = Math.max(1, Math.floor(width * scale));
  const cropH = Math.max(1, Math.floor(height * scale));
  const x0 = Math.floor((width - cropW) / 2);
  const y0 = Math.floor((height - cropH) / 2);

  const mask = new Array<boolean>(width * height).fill(false);

  for (let y = y0; y < y0 + cropH; y++) {
    for (let x = x0; x < x0 + cropW; x++) {
      mask[y * width + x] = true;
    }
  }

  return mask;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function augmentTile(
  tile: SpectralTile,
  policy: AugmentationPolicy,
  seedOffset = 0
): SpectralTile {
  const width = tile.metadata.width;
  const height = tile.metadata.height;
  const rand = mulberry32(policy.seed + seedOffset);

  const rotationIndex = Math.floor(rand() * policy.rotations.length) % policy.rotations.length;
  const rotation = policy.rotations[rotationIndex] ?? 0;

  const flipH = policy.flipHorizontal && rand() > 0.5;
  const flipV = policy.flipVertical && rand() > 0.5;

  const brightnessFactor = 1 + ((rand() * 2 - 1) * policy.brightnessJitter);
  const cropScale = policy.cropScaleRange[0] + (policy.cropScaleRange[1] - policy.cropScaleRange[0]) * rand();

  const rotationPerm = rotatePermutation(width, height, rotation);
  const flipPerm = flipPermutation(width, height, flipH, flipV);
  const validMask = cropMask(width, height, cropScale);

  const augmentedBands: SpectralTile['bands'] = {};
  for (const [band, values] of Object.entries(tile.bands)) {
    const rotated = applyPermutation(values, rotationPerm);
    const flipped = applyPermutation(rotated, flipPerm);

    augmentedBands[band] = flipped.map((value, index) => {
      if (!validMask[index] || Number.isNaN(value)) {
        return Number.NaN;
      }

      const noise = boxMuller(rand) * policy.spectralNoiseStd;
      return clamp(value * brightnessFactor + noise);
    });
  }

  return {
    ...tile,
    bands: augmentedBands,
    metadata: {
      ...tile.metadata,
      augmentationVersion: policy.version,
      augmentationSeed: policy.seed + seedOffset,
      augmentationRotation: rotation,
      augmentationFlipHorizontal: flipH,
      augmentationFlipVertical: flipV,
      augmentationCropScale: cropScale,
      augmentationBrightnessFactor: brightnessFactor,
    },
  };
}
