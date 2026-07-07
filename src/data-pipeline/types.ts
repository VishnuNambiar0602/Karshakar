export type BandMap = Record<string, number[]>;

export interface TileMetadata {
  tileId: string;
  timestamp: string;
  crs: string;
  resolutionMeters: number;
  width: number;
  height: number;
  sourceUri?: string;
  reprojectionMethod?: 'nearest' | 'bilinear' | 'cubic';
  harmonizationNote?: string;
  [key: string]: unknown;
}

export interface SpectralTile {
  bands: BandMap;
  metadata: TileMetadata;
  qa60?: number[];
  scl?: number[];
}

export interface CloudMaskPolicy {
  useSCL: boolean;
  useQA60: boolean;
  maxCloudCoverage: number;
  cloudScoreThreshold: number;
  keepSCLClasses: number[];
}

export interface CloudMaskResult {
  maskedTile: SpectralTile;
  cloudCoverageRatio: number;
  cloudScore: number;
  keep: boolean;
  totalPixels: number;
  cloudPixels: number;
}

export interface BandStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
}

export interface NormalizationStats {
  bands: Record<string, BandStats>;
  strategy: 'zscore' | 'minmax';
  generatedAt: string;
  datasetId: string;
}

export interface AugmentationPolicy {
  version: string;
  seed: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotations: Array<0 | 90 | 180 | 270>;
  cropScaleRange: [number, number];
  brightnessJitter: number;
  spectralNoiseStd: number;
}

export interface ManifestEntry {
  inputHash: string;
  transformVersion: string;
  policyVersion: string;
  outputUri: string;
  tileId: string;
  bytesProcessed: number;
  cloudCoverageRatio: number;
  generatedAt: string;
}

export interface JobCheckpoint {
  jobId: string;
  lastChunkIndex: number;
  processedTiles: number;
  processedBytes: number;
  failures: number;
  updatedAt: string;
}

export interface ChunkedJobOptions {
  jobId: string;
  chunkSize: number;
  retryLimit: number;
  checkpointFilePath: string;
  manifestFilePath: string;
  outputDirectory: string;
  transformVersion: string;
  policyVersion: string;
}

export interface BenchmarkResult {
  bytesProcessed: number;
  tilesProcessed: number;
  secondsElapsed: number;
  throughputBytesPerSecond: number;
  reachedOneTerabyte: boolean;
}
