'use server';

/**
 * @fileOverview A flow for suggesting coordinates based on a textual description of a location.
 *
 * - suggestCoordinates - A function that handles the coordinate suggestion process.
 * - SuggestCoordinatesInput - The input type for the suggestCoordinates function.
 * - SuggestCoordinatesOutput - The return type for the suggestCoordinates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

const SuggestCoordinatesInputSchema = z.object({
  locationDescription: z
    .string()
    .describe('A textual description of a location (e.g., Amazon rainforest).'),
});
export type SuggestCoordinatesInput = z.infer<typeof SuggestCoordinatesInputSchema>;

const SuggestCoordinatesOutputSchema = z.object({
  latitude: z.number().describe('The suggested latitude for the location.'),
  longitude: z.number().describe('The suggested longitude for the location.'),
  confidence: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the accuracy of the suggested coordinates.'
    ),
});
export type SuggestCoordinatesOutput = z.infer<typeof SuggestCoordinatesOutputSchema>;

const suggestCoordinatesPrompt = ai.definePrompt({
  name: 'suggestCoordinatesPrompt',
  input: {schema: SuggestCoordinatesInputSchema},
  prompt: `You are a geography expert. Given a location description, suggest relevant latitude and longitude coordinates.

Location Description: {{{locationDescription}}}

You MUST respond with a valid JSON object ONLY. Do not include any other text, formatting, or code fences.
Your response should conform to the following JSON schema:
{
  "type": "object",
  "properties": {
    "latitude": { "type": "number" },
    "longitude": { "type": "number" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["latitude", "longitude", "confidence"]
}

The confidence score should be between 0 and 1, indicating the accuracy of the suggested coordinates. Consider the precision of the location description when determining the confidence score. For example, a general description like 'Amazon rainforest' should have a lower confidence score than a specific address.
`,
});

export async function suggestCoordinates(input: SuggestCoordinatesInput): Promise<SuggestCoordinatesOutput> {
    const response = await executePromptWithFallback(suggestCoordinatesPrompt, input, undefined, 'coordinates');
    const textResponse = response.text;

    if (!textResponse) {
      throw new Error('AI failed to suggest coordinates.');
    }

    try {
      const parsedJson = safeParseAIJson(textResponse, (data) => SuggestCoordinatesOutputSchema.parse(data));
      return parsedJson;
    } catch (e) {
      console.error("Failed to parse JSON response from AI:", textResponse);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
}
