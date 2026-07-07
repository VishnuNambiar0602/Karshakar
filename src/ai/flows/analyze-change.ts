'use server';

/**
 * @fileOverview A flow for analyzing environmental changes based on computed metrics.
 * - analyzeChange - A function that interprets changes in metrics.
 * - AnalyzeChangeInput - The input type for the function.
 * - AnalyzeChangeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

// Define the Change Classification categories as per ROADMAP.md
const ChangeClassificationSchema = z.enum([
  'Normal',
  'Transitional',
  'Concerning',
  'Critical'
]).describe('The classification of the detected change.');

export type ChangeClassification = z.infer<typeof ChangeClassificationSchema>;

// Define the schema for a single metric's summary
const MetricSummarySchema = z.object({
  name: z.string(),
  value: z.number().nullable(),
  change: z.number().nullable(),
  trend: z.enum(['increasing', 'decreasing', 'stable', 'unknown']),
});

// Input Schema: Takes current metrics and context
const AnalyzeChangeInputSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    description: z.string().optional(),
  }),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  metrics: z.array(MetricSummarySchema).describe('List of computed metrics (NDVI, NDWI, etc.) with their values and changes.'),
  historicalContext: z.string().optional().describe('Optional historical context or baseline description.'),
});

export type AnalyzeChangeInput = z.infer<typeof AnalyzeChangeInputSchema>;

// Output Schema: The structured insight
const AnalyzeChangeOutputSchema = z.object({
  classification: ChangeClassificationSchema,
  confidenceScore: z.number().min(0).max(1).describe('Confidence score between 0 and 1.'),
  explanation: z.string().describe('A human-readable explanation of the change, providing context and potential causes.'),
  recommendedAction: z.string().describe('A recommended course of action (e.g., Monitor, Flag, Summarize).'),
});

export type AnalyzeChangeOutput = z.infer<typeof AnalyzeChangeOutputSchema>;

// Schema for the Prompt Input (flattened metrics to string)
const PromptInputSchema = z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      description: z.string().optional(),
    }),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
    metricsText: z.string(),
    historicalContext: z.string().optional(),
});


const analyzeChangePrompt = ai.definePrompt({
  name: 'analyzeChangePrompt',
  input: { schema: PromptInputSchema },
  prompt: `You are an expert environmental analyst AI for the Earth Insights Dashboard. Your goal is to interpret environmental changes based on satellite-derived metrics.

  **Objective:**
  Analyze the provided environmental metrics for the given location and date range to detect, classify, and explain significant changes.

  **Input Data:**
  - Location: {{{location.latitude}}}, {{{location.longitude}}} ({{{location.description}}})
  - Date Range: {{{dateRange.start}}} to {{{dateRange.end}}}
  - Metrics:
{{{metricsText}}}
  - Historical Context: {{{historicalContext}}}

  **Analysis Logic (Follow Strictly):**
  1.  **Measure**: Evaluate the magnitude and direction of change for each metric.
  2.  **Contextualize**: Consider the historical context and expected seasonal variations.
  3.  **Correlate**: Look for compound patterns (e.g., NDVI decline + NDBI increase).
  4.  **Classify**: Assign one of the following categories:
      - **Normal**: Seasonal cycles, harvest patterns, expected variations.
      - **Transitional**: Early-stage stress, gradual changes, recovery.
      - **Concerning**: Rapid declines outside norms, compound negative signals.
      - **Critical**: Severe degradation, abrupt land-use conversion, disaster signatures.
  5.  **Explain**: Generate a clear, neutral, and trustworthy explanation.
  6.  **Act**: Recommend a specific action based on the classification.

  **Metric-Specific Rules:**
  - **NDVI (Vegetation)**: Small seasonal drops are Normal. Sustained decline is Concerning. NDVI ↓ + NDBI ↑ is likely land-use conversion.
  - **NDWI (Water)**: Seasonal fluctuations are Normal. Persistent reduction is Water Stress.
  - **NDBI (Built-up)**: Gradual increase is Transitional. Rapid increase with NDVI loss is Concerning.
  - **Compound Changes**: Prioritize compound signals (e.g., NDVI ↓ + NDBI ↑) as they increase confidence.

  **Output Requirements:**
  You MUST return a valid JSON object.
  The keys MUST be exactly as follows: "classification", "confidenceScore", "explanation", "recommendedAction".
  Do NOT use keys like "changeClassification" or "action".
  
  Example Output:
  {
    "classification": "Concerning",
    "confidenceScore": 0.85,
    "explanation": "A significant decline in NDVI coupled with increasing NDBI suggests potential deforestation.",
    "recommendedAction": "Flag for immediate review."
  }
  `,
});

export async function analyzeChange(input: AnalyzeChangeInput): Promise<AnalyzeChangeOutput> {
  // Format metrics into a clear string
  const metricsText = input.metrics.map(m => 
    `* Metric: ${m.name} | Value: ${m.value?.toFixed(2) ?? 'N/A'} | Change: ${m.change?.toFixed(2) ?? 'N/A'} | Trend: ${m.trend}`
  ).join('\n');

  const promptInput = {
      location: input.location,
      dateRange: input.dateRange,
      historicalContext: input.historicalContext,
      metricsText
  };

  const response = await executePromptWithFallback(analyzeChangePrompt, promptInput, undefined, 'analyze-change');
  const textResponse = response.text;

  if (!textResponse) {
    throw new Error("The AI model did not return a change analysis output.");
  }

  try {
    return safeParseAIJson(textResponse, (data: any) => {
        // Handle common hallucination of "changeClassification"
        if (data.changeClassification && !data.classification) {
            data.classification = data.changeClassification;
        }
        return AnalyzeChangeOutputSchema.parse(data);
    });
  } catch (e) {
    console.error("Failed to parse JSON response from AI:", textResponse);
    throw new Error("AI returned invalid JSON format.");
  }
}
