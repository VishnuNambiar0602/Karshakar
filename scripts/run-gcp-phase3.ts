import { runBatchOrchestration } from '../src/gcp-orchestration';

function argValue(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1] as string;
  }
  return fallback;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const jobId = argValue(args, 'jobId', `phase3-${Date.now()}`);
  const requestId = argValue(args, 'requestId', `req-${Date.now()}`);
  const datasetVersion = argValue(args, 'datasetVersion', 'phase2-dataset-v1');
  const modelVersionCandidate = argValue(args, 'modelVersion', 'phase2-v1');

  const result = await runBatchOrchestration({
    jobId,
    requestId,
    datasetVersion,
    modelVersionCandidate,
    trigger: 'manual',
  });

  console.log(
    JSON.stringify(
      {
        status: result.state.status,
        stages: result.state.stages.length,
        dlqMessages: result.dlqMessages.length,
        publishedTopics: result.publishedTopics,
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
