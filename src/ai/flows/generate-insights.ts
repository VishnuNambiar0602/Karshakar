// This file uses server-side code, marking it with 'use server'.
'use server';

/**
 * @fileOverview AI-powered insights generator for environmental data.
 *
 * - generateDataInsights - A function that generates insights about the data.
 * - GenerateDataInsightsInput - The input type for the generateDataInsights function.
 * - GenerateDataInsightsOutput - The return type for the generateDataInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

const GenerateDataInsightsInputSchema = z.object({
  metricName: z.string().describe('The name of the metric.'),
  firstValue: z.number().describe('The first value of the metric.'),
  lastValue: z.number().describe('The last value of the metric.'),
  percentageChange: z.number().describe('The percentage change of the metric.'),
  numberOfValidPoints: z.number().describe('The number of valid data points for the metric.'),
});
export type GenerateDataInsightsInput = z.infer<typeof GenerateDataInsightsInputSchema>;

const GenerateDataInsightsOutputSchema = z.object({
  insight: z.string().describe('The generated insight about the data.'),
});
export type GenerateDataInsightsOutput = z.infer<typeof GenerateDataInsightsOutputSchema>;

const generateDataInsightsPrompt = ai.definePrompt({
  name: 'generateDataInsightsPrompt',
  input: {schema: GenerateDataInsightsInputSchema},
  prompt: `You are an AI assistant that analyzes environmental metrics and generates a concise, insightful, single-sentence summary.

  Given the following data, provide a single sentence about an interesting trend or anomaly.

  Metric Name: {{{metricName}}}
  First Value: {{{firstValue}}}
  Last Value: {{{lastValue}}}
  Percentage Change: {{{percentageChange}}}
  Number of Valid Points: {{{numberOfValidPoints}}}

  Your response MUST be a valid JSON object ONLY, with a single key "insight" containing the string insight.
  Example: {"insight": "The significant decrease in NDVI suggests a potential loss of vegetation in the area."}
  `,
});

export async function generateDataInsights(input: GenerateDataInsightsInput): Promise<GenerateDataInsightsOutput> {
    const response = await executePromptWithFallback(generateDataInsightsPrompt, input, undefined, 'insights');
    const textResponse = response.text;
    
    if (!textResponse) {
      throw new Error('AI failed to generate an insight.');
    }

    try {
      const parsedJson = safeParseAIJson(textResponse, (data) => GenerateDataInsightsOutputSchema.parse(data));
      return parsedJson;
    } catch (e) {
      console.error("Failed to parse JSON response from AI:", textResponse);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
}
