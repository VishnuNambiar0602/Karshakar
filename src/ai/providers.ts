/**
 * @fileOverview Multi-provider AI configuration supporting free APIs
 * Providers: Groq (primary), HuggingFace (fallback), Mistral (fallback)
 */
import 'server-only';

import Groq from 'groq-sdk';
import { logger } from '@/lib/logger';
import { redactSensitive } from '@/lib/security';

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  model: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface GenerationResponse {
  text: string;
  provider: string;
  model: string;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// GROQ Provider (Recommended - Fastest, Most Generous Free Tier)
// Free Tier: 14,400 requests/day (~600/hour)
// Speed: 100+ tokens/second
// Models: llama-3.1-70b-versatile, llama-3.2-3b, gemma2-9b
// ============================================================================

export async function generateWithGroq(
  prompt: string,
  config?: Partial<ProviderConfig>
): Promise<GenerationResponse> {
  const apiKey = config?.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not found in environment');
  }

  const client = new Groq({ apiKey });
  
  const model = config?.model || 'llama-3.3-70b-versatile';
  
  const response = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model,
    max_tokens: config?.maxTokens || 2048,
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content || '';
  
  if (!text) {
    throw new Error('No response from Groq');
  }

  return { text, provider: 'groq', model };
}

// ============================================================================
// HuggingFace Provider (Free, Good Limits)
// Free Tier: Varies by model, ~30k requests/month (generous)
// Speed: Variable
// Using the HuggingFace Serverless Inference API
// ============================================================================

export async function generateWithHuggingFace(
  prompt: string,
  config?: Partial<ProviderConfig>
): Promise<GenerationResponse> {
  const apiKey = config?.apiKey || process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not found in environment');
  }

  // Use a model that supports text-generation on HF Inference API
  const model = config?.model || 'mistralai/Mistral-7B-Instruct-v0.3';
  
  // Use the serverless inference endpoint with text-generation-inference
  const controller = new AbortController();
  const timeoutMs = config?.timeoutMs || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: config?.maxTokens || 1024,
          return_full_text: false,
        },
      }),
    }
  );
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HuggingFace error: ${response.status} - ${sanitizeError(errorBody)}`);
  }

  const result: any = await response.json();
  const text = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || '';

  if (!text) {
    throw new Error('No response from HuggingFace');
  }

  return { text, provider: 'huggingface', model };
}

/**
 * Sanitizes error messages to prevent API key or auth header leaks.
 */
function sanitizeError(error: string): string {
  if (!error) return 'Unknown error';
  // Remove potential Bearer tokens or API keys (hex/base64-like strings > 20 chars)
  return error
    .replace(/Bearer\s+[a-zA-Z0-9._\-\/]{20,}/gi, 'Bearer [REDACTED]')
    .replace(/key=[a-zA-Z0-9._\-\/]{20,}/gi, 'key=[REDACTED]')
    .replace(/[a-zA-Z0-9._\-\/]{40,}/g, (match) => {
      // If it looks like a long hash/token, redact it
      return '[REDACTED]';
    })
    .substring(0, 500); // Limit length
}

// ============================================================================
// Mistral Provider (Free, Very Good)
// Free Tier: 14,400 requests/day via API
// Speed: Good
// Models: mistral-small, mistral-medium
// ============================================================================

export async function generateWithMistral(
  prompt: string,
  config?: Partial<ProviderConfig>
): Promise<GenerationResponse> {
  const apiKey = config?.apiKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not found in environment');
  }

  const model = config?.model || 'mistral-small-latest';

  const controller = new AbortController();
  const timeoutMs = config?.timeoutMs || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config?.maxTokens || 1024,
    }),
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral error: ${response.status} - ${sanitizeError(errorBody)}`);
  }

  const result: any = await response.json();
  const text = result.choices?.[0]?.message?.content || '';

  if (!text) {
    throw new Error('No response from Mistral');
  }

  return { text, provider: 'mistral', model };
}

// ============================================================================
// Provider Selection & Fallback
// ============================================================================

export enum AIProvider {
  GROQ = 'groq',
  HUGGINGFACE = 'huggingface',
  MISTRAL = 'mistral',
}

export const PROVIDER_ORDER: AIProvider[] = [
  AIProvider.GROQ, // PRIMARY FREE: Fastest, most generous, 100% free forever (14.4k/day)
  AIProvider.MISTRAL, // SECONDARY: Good quality, reliable API
  AIProvider.HUGGINGFACE, // TERTIARY: Backup (API may be unstable)
];

const providerMap: Record<AIProvider, typeof generateWithGroq> = {
  [AIProvider.GROQ]: generateWithGroq,
  [AIProvider.HUGGINGFACE]: generateWithHuggingFace,
  [AIProvider.MISTRAL]: generateWithMistral,
};

export interface GenerateOptions {
  prompt: string;
  providers?: AIProvider[];
  maxRetries?: number;
  timeoutMs?: number;
  config?: Partial<ProviderConfig>;
}

/**
 * Generate text using multiple providers with automatic fallback
 * Tries providers in order until one succeeds
 */
export async function generateWithFallback(
  options: GenerateOptions
): Promise<GenerationResponse> {
  const providers = options.providers || PROVIDER_ORDER;
  const maxRetries = Math.min(options.maxRetries || 3, 5);
  const timeoutMs = options.timeoutMs || 15000;
  let lastError: Error | null = null;

  for (const provider of providers) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const generateFn = providerMap[provider];
        logger.info('provider_attempt', { scope: 'ai.providers', provider, attempt: attempt + 1, maxRetries });
        
        const response = await withTimeout(
          generateFn(options.prompt, { ...options.config, timeoutMs }),
          timeoutMs,
          `${provider} request`
        );
        logger.info('provider_success', { scope: 'ai.providers', provider, model: response.model });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        
        logger.warn('provider_failure', {
          scope: 'ai.providers',
          provider,
          attempt: attempt + 1,
          maxRetries,
          error: redactSensitive(errorMsg),
        });

        // If API key is missing, skip to next provider immediately
        if (errorMsg.includes('not found in environment')) {
          logger.warn('provider_missing_key', { scope: 'ai.providers', provider });
          break; // Move to next provider
        }

        // Rate limit - retry same provider
        if (
          errorMsg.includes('429') ||
          errorMsg.includes('rate limit') ||
          errorMsg.includes('quota')
        ) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.info('provider_rate_limited_retry', { scope: 'ai.providers', provider, delayMs });
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        // Other errors - try next provider
        break;
      }
    }
  }

  throw new Error(
    `All AI providers failed. Last error: ${lastError?.message || 'Unknown'}`
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = [];

  if (process.env.GROQ_API_KEY) available.push(AIProvider.GROQ);
  if (process.env.HUGGINGFACE_API_KEY) available.push(AIProvider.HUGGINGFACE);
  if (process.env.MISTRAL_API_KEY) available.push(AIProvider.MISTRAL);

  return available;
}

export function getProviderStatus(): Record<AIProvider, boolean> {
  return {
    [AIProvider.GROQ]: !!process.env.GROQ_API_KEY,
    [AIProvider.HUGGINGFACE]: !!process.env.HUGGINGFACE_API_KEY,
    [AIProvider.MISTRAL]: !!process.env.MISTRAL_API_KEY,
  };
}

export function getProviderLimits(): Record<AIProvider, string> {
  return {
    [AIProvider.GROQ]:
      '14,400 requests/day (~600/hour) - FASTEST & RECOMMENDED',
    [AIProvider.HUGGINGFACE]: '~30k requests/month - Good for backup',
    [AIProvider.MISTRAL]: '14,400 requests/day - Good quality',
  };
}
