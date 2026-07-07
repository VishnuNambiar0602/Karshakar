export function redactSensitive(input: string): string {
  if (!input) {
    return '';
  }

  return input
    .replace(/Bearer\s+[a-zA-Z0-9._\-/]{12,}/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?key|token|secret|password)=([^&\s]+)/gi, '$1=[REDACTED]')
    .replace(/([?&](?:api[_-]?key|token|secret|password)=)([^&]+)/gi, '$1[REDACTED]')
    .replace(/[a-zA-Z0-9._\-/]{40,}/g, '[REDACTED]')
    .slice(0, 800);
}

export function sanitizePromptInput(input: string): string {
  return input
    .replace(/<\|.*?\|>/g, '')
    .replace(/\[INST\]|\[\/INST\]/gi, '')
    .replace(/<\/?(?:system|user|assistant)>/gi, '')
    .replace(/ignore\s+previous\s+instructions/gi, '[FILTERED]')
    .replace(/you\s+are\s+now/gi, '[FILTERED]')
    .replace(/developer\s+mode/gi, '[FILTERED]')
    .trim()
    .slice(0, 4000);
}

export function sanitizePromptPayload<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizePromptInput(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePromptPayload(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sanitizePromptPayload(item),
    ]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}
