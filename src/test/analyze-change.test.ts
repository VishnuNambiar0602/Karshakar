import { describe, expect, it } from 'vitest';
import { analyzeChange } from '@/ai/flows/analyze-change';

describe('analyzeChange AI Flow', () => {
  it('correctly identifies Concerning environmental changes', async () => {
    // Skip if no API key is present
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      console.warn('Skipping analyzeChange test: AI API keys not found.');
      return;
    }

    const input = {
      location: {
        latitude: -3.4653,
        longitude: -62.2159,
        description: "Amazon Rainforest, Brazil"
      },
      dateRange: {
        start: "2023-01-01",
        end: "2023-12-31"
      },
      metrics: [
        { name: "NDVI", value: 0.4, change: -0.3, trend: "decreasing" as const },
        { name: "NDWI", value: 0.1, change: -0.1, trend: "decreasing" as const },
        { name: "NDBI", value: 0.2, change: 0.15, trend: "increasing" as const },
        { name: "NBR", value: 0.3, change: -0.2, trend: "decreasing" as const }
      ],
      historicalContext: "Historically dense rainforest with high vegetation indices (NDVI > 0.7) and stable moisture levels."
    };

    const result = await analyzeChange(input);
    
    expect(result.classification).toBeDefined();
    expect(['Concerning', 'Critical']).toContain(result.classification);
    expect(result.confidenceScore).toBeGreaterThan(0.5);
    expect(result.explanation).toContain('NDVI');
  }, 30000); // Higher timeout for AI calls
});
