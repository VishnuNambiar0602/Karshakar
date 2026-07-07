import { logger } from '@/lib/logger';
import { redactSensitive } from '@/lib/security';

export function isRetryableError(error: unknown): boolean {
  const errorMessage = (error as { message?: string })?.message?.toLowerCase() || '';
  const errorCode = (error as { code?: string })?.code || '';

  return (
    errorMessage.includes('429') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('resource_exhausted') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('temporarily unavailable') ||
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorCode === 'UNAVAILABLE'
  );
}

export function shouldTryNextModel(error: unknown): boolean {
  const errorMessage = (error as { message?: string })?.message?.toLowerCase() || '';

  return (
    errorMessage.includes('404') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('not supported') ||
    errorMessage.includes('invalid model') ||
    errorMessage.includes('model does not exist')
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateDelay(baseDelay: number, attempt: number, useExponentialBackoff: boolean): number {
  if (useExponentialBackoff) {
    const jitter = Math.random() * 500;
    return Math.min(baseDelay * Math.pow(2, attempt) + jitter, 60000);
  }
  return baseDelay;
}

export function sanitizeInput(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/<\|.*?\|>/g, '')
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
    .replace(/<system>|<user>|<assistant>/gi, '')
    .replace(/ignore previous instructions/gi, '[INJECTION ATTEMPT]')
    .replace(/you are now/gi, '[INJECTION ATTEMPT]')
    .trim();
}

export function safeParseAIJson<T>(text: string, validator?: (data: unknown) => T): T {
  let cleanedText = text.trim();

  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }

  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }

  cleanedText = cleanedText.trim();

  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleanedText);
    return validator ? validator(parsed) : parsed;
  } catch {
    logger.error('ai_json_parse_failed', {
      scope: 'ai.ai-utils',
      error: redactSensitive(text),
    });
    throw new Error('AI returned invalid JSON format. Please try again.');
  }
}

export function logAIOperation(
  operation: string,
  model: string,
  success: boolean,
  durationMs?: number,
  error?: string
): void {
  const payload = {
    scope: 'ai.ai-utils',
    operation,
    model,
    success,
    durationMs,
    error: error ? redactSensitive(error) : undefined,
  };

  if (success) {
    logger.info('ai_operation_success', payload);
  } else {
    logger.error('ai_operation_failed', payload);
  }
}
