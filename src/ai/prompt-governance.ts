import 'server-only';

import { logger } from '@/lib/logger';

export type PromptVersion = {
  flow: string;
  version: string;
  checksum: string;
  active: boolean;
};

const PROMPT_REGISTRY: PromptVersion[] = [
  { flow: 'chatbot', version: 'v1.0.0', checksum: 'chatbot-v1', active: true },
  { flow: 'analyze-change', version: 'v1.0.0', checksum: 'analyze-change-v1', active: true },
  { flow: 'crop-yield', version: 'v1.0.0', checksum: 'crop-yield-v1', active: true },
  { flow: 'suggest-crop', version: 'v1.0.0', checksum: 'suggest-crop-v1', active: true },
];

export function resolvePromptVersion(flow: string): PromptVersion {
  const rollbackVersion = process.env.PROMPT_ROLLBACK_VERSION;
  if (rollbackVersion) {
    return {
      flow,
      version: rollbackVersion,
      checksum: `${flow}-${rollbackVersion}`,
      active: true,
    };
  }

  const found = PROMPT_REGISTRY.find((entry) => entry.flow === flow && entry.active);
  return (
    found || {
      flow,
      version: 'v1.0.0',
      checksum: `${flow}-v1`,
      active: true,
    }
  );
}

export function monitorPromptQuality(flow: string, qualityScore: number, sampleSize: number): void {
  logger.info('prompt_quality_sample', {
    scope: 'ai.prompt-governance',
    flow,
    qualityScore,
    sampleSize,
  });
}
