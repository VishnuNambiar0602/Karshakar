import type { SpectralTile, TileMetadata } from './types';

export interface HarmonizationPolicy {
  targetResolutionMeters: number;
  targetCrs: string;
  reprojectionMethod: TileMetadata['reprojectionMethod'];
}

export const defaultHarmonizationPolicy: HarmonizationPolicy = {
  targetResolutionMeters: 10,
  targetCrs: 'EPSG:4326',
  reprojectionMethod: 'bilinear',
};

export function stampHarmonizationMetadata(
  tile: SpectralTile,
  policy: HarmonizationPolicy = defaultHarmonizationPolicy
): SpectralTile {
  return {
    ...tile,
    metadata: {
      ...tile.metadata,
      sourceCrs: tile.metadata.crs,
      sourceResolutionMeters: tile.metadata.resolutionMeters,
      crs: policy.targetCrs,
      resolutionMeters: policy.targetResolutionMeters,
      reprojectionMethod: policy.reprojectionMethod,
      harmonizationNote: 'Metadata stamp for reprojection/resampling policy applied.',
    },
  };
}
