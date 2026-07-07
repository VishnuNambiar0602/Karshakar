
'use server';

/**
 * @fileOverview A flow for suggesting a suitable crop based on detailed farm parameters.
 * This flow now uses tools to automatically fetch soil type and moisture data.
 * - suggestCrop - A function that handles the crop suggestion process.
 * - SuggestCropInput - The input type for the suggestCrop function.
 * - SuggestCropOutput - The return type for the suggestCrop function.
 */

import { ai } from '@/ai/genkit';
import { getSoilMoisture } from '@/ai/tools/get-soil-moisture';
import { getSoilType } from '@/ai/tools/get-soil-type';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

const SuggestCropInputSchema = z.object({
  latitude: z.number().describe('The latitude of the farm location.'),
  longitude: z.number().describe('The longitude of the farm location.'),
  climateDescription: z.string().describe("A brief description of the local climate (e.g., 'hot and arid with monsoon season', 'temperate with cold winters')."),
  currentCrop: z.string().optional().describe('The crop currently or recently grown in the field, if any.'),
  language: z.string().optional().default('en').describe('The language for the output reasoning.'),
});
export type SuggestCropInput = z.infer<typeof SuggestCropInputSchema>;

const SuggestCropOutputSchema = z.object({
    suggestedCrop: z.string().describe("The single most suitable crop for the given conditions."),
    suitabilityScore: z.number().min(0).max(100).describe("A percentage score (0-100) indicating how suitable the suggested crop is for the provided conditions. This should be based on how well the crop's needs align with the fetched, real-world data."),
    reasoning: z.string().describe("A clear, concise explanation for the crop recommendation, detailing how factors like soil, climate, and moisture influenced the decision. You MUST explicitly reference the real-world data returned by your tools."),
    alternativeCrop: z.string().optional().describe("A secondary, alternative crop suggestion."),
    fetchedSoilType: z.string().describe("The soil type automatically determined by the AI tools."),
    fetchedMoistureLevel: z.enum(['Dry', 'Optimal', 'Wet']).describe("The soil moisture level automatically determined by the AI tools."),
});
export type SuggestCropOutput = z.infer<typeof SuggestCropOutputSchema>;


const suggestCropPrompt = ai.definePrompt({
  name: 'suggestCropPrompt',
  input: { schema: SuggestCropInputSchema },
  tools: [getSoilMoisture, getSoilType],
  prompt: `You are an expert agronomist and soil scientist AI model advising a farmer. Your task is to recommend the best possible crop for their field based on real-time, location-specific data.

  Your response must be in the specified language: {{{language}}}.

  Your process must follow these steps:
  1.  **Data Acquisition**: Use the provided tools ('getSoilType' and 'getSoilMoisture') to determine the soil type and current moisture level for the given coordinates. You must use these tools; do not guess or use generalized knowledge.
  2.  **Multi-factor Analysis**: Synthesize all available information to provide a practical, well-reasoned crop suggestion. Consider the following factors:
      *   The fetched real-world soil type and its properties (e.g., water retention, fertility).
      *   The fetched real-world moisture level.
      *   The farmer's description of the local climate.
      *   Crop rotation principles if a previous crop is mentioned.

  Farm Parameters:
  - Location: Latitude {{{latitude}}}, Longitude {{{longitude}}}
  - Local Climate: {{{climateDescription}}}
  {{#if currentCrop}}
  - Previous/Current Crop: {{{currentCrop}}}
  {{/if}}

  Your final output MUST be a valid JSON object ONLY that conforms to the SuggestCropOutput schema.
  - 'suggestedCrop': Identify the single best crop for these exact conditions.
  - 'suitabilityScore': Provide a percentage score (0-100) representing your confidence. Base this score on how perfectly the crop's needs match the specific, real-world data you fetched.
  - 'reasoning': Give a detailed but easy-to-understand explanation IN THE REQUESTED LANGUAGE ({{{language}}}). Justify your choice by explicitly referencing the climate description and, most importantly, the soil and moisture data you fetched using your tools.
  - 'alternativeCrop': Suggest one other viable crop as an alternative.
  - 'fetchedSoilType' and 'fetchedMoistureLevel': Populate these fields with the exact results from your tool calls.
  `,
});

export async function suggestCrop(input: SuggestCropInput): Promise<SuggestCropOutput> {
    const response = await executePromptWithFallback(suggestCropPrompt, input, undefined, 'suggest-crop');
    const textResponse = response.text;
    
    if (!textResponse) {
      throw new Error("The AI model did not return an output. Please try again.");
    }
    
    try {
        const parsedJson = safeParseAIJson(textResponse, (data) => SuggestCropOutputSchema.parse(data));
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", textResponse);
        throw new Error("AI returned invalid JSON format. Please try again.");
    }
}
