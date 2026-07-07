import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  runChunkedPreprocessingJob,
  validateOneTerabyteRun,
  type SpectralTile,
} from '../src/data-pipeline';

interface CliArgs {
  input: string;
  output: string;
  jobId: string;
  datasetId: string;
  chunkSize: number;
  retryLimit: number;
}

function parseArgs(argv: string[]): CliArgs {
  const pairs = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key?.startsWith('--') && value) {
      pairs.set(key.slice(2), value);
    }
  }

  return {
    input: pairs.get('input') ?? 'data/tiles.json',
    output: pairs.get('output') ?? 'artifacts/pipeline',
    jobId: pairs.get('jobId') ?? `job-${Date.now()}`,
    datasetId: pairs.get('datasetId') ?? 'dataset-default',
    chunkSize: Number(pairs.get('chunkSize') ?? 64),
    retryLimit: Number(pairs.get('retryLimit') ?? 2),
  };
}

async function readTiles(filePath: string): Promise<SpectralTile[]> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as SpectralTile[];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const manifestFilePath = path.join(args.output, 'manifest.json');
  const checkpointFilePath = path.join(args.output, 'checkpoint.json');

  const tiles = await readTiles(args.input);
  const result = await runChunkedPreprocessingJob(
    tiles,
    {
      jobId: args.jobId,
      chunkSize: args.chunkSize,
      retryLimit: args.retryLimit,
      checkpointFilePath,
      manifestFilePath,
      outputDirectory: path.join(args.output, 'tiles'),
      transformVersion: 'phase1-preprocess-v1',
      policyVersion: 'phase1-policy-v1',
    },
    {
      datasetId: args.datasetId,
      normalizationStrategy: 'zscore',
      cloudPolicyVersion: 'cloud-v1',
      augmentationPolicyVersion: 'aug-v1',
      harmonizationPolicyVersion: 'harm-v1',
    }
  );

  const validation = validateOneTerabyteRun(result.benchmark);

  console.log(
    JSON.stringify(
      {
        benchmark: result.benchmark,
        validation,
        checkpoint: result.checkpoint,
        normalizationStatsPath: result.normalizationStatsPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
