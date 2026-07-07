import path from 'node:path';
import { runPhase2TrainingPipeline } from '../src/ml/pipeline';

function parseOutputArg(argv: string[]): string {
  const outputFlagIndex = argv.findIndex((arg) => arg === '--output');
  if (outputFlagIndex >= 0 && argv[outputFlagIndex + 1]) {
    return argv[outputFlagIndex + 1] as string;
  }
  return path.join('artifacts', 'ml-phase2');
}

async function main(): Promise<void> {
  const outputDir = parseOutputArg(process.argv.slice(2));
  const result = await runPhase2TrainingPipeline(outputDir);

  console.log(
    JSON.stringify(
      {
        outputDir,
        experimentLogPath: result.experimentLogPath,
        artifactPath: result.artifactPath,
        reachedTarget: result.sweepSummary.reachedTarget,
        bestMiou: result.sweepSummary.bestRun.bestMetrics.mIoU,
        bestRunId: result.sweepSummary.bestRun.runId,
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
