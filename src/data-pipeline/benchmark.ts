import type { BenchmarkResult } from './types';

export interface BenchmarkValidation {
  passed: boolean;
  summary: string;
}

export function validateOneTerabyteRun(result: BenchmarkResult): BenchmarkValidation {
  if (result.reachedOneTerabyte) {
    return {
      passed: true,
      summary: `Processed ${(result.bytesProcessed / 1_099_511_627_776).toFixed(2)} TB at ${(result.throughputBytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s.`,
    };
  }

  const remaining = 1_099_511_627_776 - result.bytesProcessed;
  return {
    passed: false,
    summary: `Processed ${(result.bytesProcessed / 1_099_511_627_776).toFixed(4)} TB. ${(remaining / (1024 * 1024 * 1024)).toFixed(2)} GB remaining to hit 1 TB target.`,
  };
}
