
'use server';

/**
 * @fileOverview An AI flow for running "what-if" scenario analysis based on user queries.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';

const ScenarioAnalysisInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location for the scenario.'),
  longitude: z.number().describe('The longitude of the location for the scenario.'),
  scenarioDescription: z.string().describe("The user's hypothetical scenario, e.g., 'a 2-degree temperature increase' or '15% more rainfall'."),
});

const ScenarioAnalysisOutputSchema = z.object({
  scenario: z.string().describe("A confirmation of the scenario being analyzed."),
  likelyImpact: z.string().describe("A detailed but clear summary of the likely ecological and agricultural impacts of the scenario."),
  confidence: z.number().min(0).max(1).describe("The model's confidence in its analysis, from 0 to 1."),
});

const scenarioPrompt = ai.definePrompt({
    name: 'runScenarioAnalysisPrompt',
    input: { schema: ScenarioAnalysisInputSchema },
    prompt: `You are an expert environmental scientist and agronomist.
      Analyze the following hypothetical scenario for the location at latitude {{{latitude}}} and longitude {{{longitude}}}.
      
      Scenario: "{{{scenarioDescription}}}"
      
      Based on your knowledge of local climate, typical ecosystems, and agricultural practices for this region, provide a detailed but clear analysis of the likely impacts.
      - What would be the primary effects on local vegetation (NDVI) and water resources (NDWI)?
      - How might this affect common agricultural crops grown in this area?
      - What are the secondary or cascading effects (e.g., on soil erosion, biodiversity, local economy)?
      
      Your response MUST be a valid JSON object ONLY that conforms to the following schema:
      {
        "scenario": "string",
        "likelyImpact": "string",
        "confidence": number (0-1)
      }
      Provide a comprehensive summary of the likely impact and a confidence score for your analysis. Your response must be grounded in plausible scientific reasoning.
      `,
});

export async function runScenarioAnalysis(input: z.infer<typeof ScenarioAnalysisInputSchema>): Promise<z.infer<typeof ScenarioAnalysisOutputSchema>> {
    const response = await executePromptWithFallback(scenarioPrompt, input, undefined, 'scenario');
    const textResponse = response.text;

    if (!textResponse) {
      throw new Error("Failed to generate a scenario analysis output.");
    }
    
    return safeParseAIJson(textResponse, (data) => ScenarioAnalysisOutputSchema.parse(data));
}
