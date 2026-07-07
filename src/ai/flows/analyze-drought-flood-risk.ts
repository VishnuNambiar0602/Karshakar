
'use server';

/**
 * @fileOverview A flow for analyzing drought and flood risk for a given location.
 * - analyzeDroughtAndFloodRisk - A function that provides a risk assessment.
 * - DroughtFloodRiskInput - The input type for the function.
 * - DroughtFloodRiskOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDroughtAndFloodRiskData } from '@/ai/tools/get-drought-flood-risk-data';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';
import { predictDroughtFloodClassical } from '@/ml';

const DroughtFloodRiskInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type DroughtFloodRiskInput = z.infer<typeof DroughtFloodRiskInputSchema>;

const DroughtFloodRiskOutputSchema = z.object({
    droughtRisk: z.enum(['Low', 'Medium', 'High']).describe("The assessed risk level for drought."),
    floodRisk: z.enum(['Low', 'Medium', 'High']).describe("The assessed risk level for flooding."),
    summary: z.string().describe("A concise summary explaining the key factors influencing the risk assessment, explicitly mentioning the fetched historical precipitation and recent soil moisture data."),
    confidence: z.number().min(0).max(1).describe("A confidence score (0-1) for the overall risk assessment."),
});
export type DroughtFloodRiskOutput = z.infer<typeof DroughtFloodRiskOutputSchema>;

const DroughtFloodSummarySchema = z.object({
  summary: z.string(),
});


const analyzeDroughtAndFloodRiskPrompt = ai.definePrompt({
  name: 'droughtFloodRiskPrompt',
  input: { schema: DroughtFloodRiskInputSchema },
  tools: [getDroughtAndFloodRiskData],
  prompt: `You are an expert hydrologist and climate scientist AI. Your task is to assess the drought and flood risk for a specific geographic location using real-time data.
  IMPORTANT: Numeric risk categories and confidence are already computed by deterministic logic. Provide only a short explanation summary.

  **Process:**
  1.  **Mandatory Data Fetching**: You MUST use the 'getDroughtAndFloodRiskData' tool to get real-world data for the given coordinates. This tool provides REAL 30-year precipitation averages and current soil moisture.
  2.  **Analysis Rules - Use ONLY real data, DO NOT make up values**:
      - Drought Risk: Compare current vs 30-year average
        * <50% of average precipitation + 'Dry' soil → HIGH risk
        * 50-80% of average + 'Dry'/'Optimal' soil → MEDIUM risk
        * >80% of average → LOW risk
      - Flood Risk: 
        * >150% of average precipitation + 'Wet' soil → HIGH risk
        * 120-150% of average + 'Wet' soil → MEDIUM risk
        * <120% of average → LOW risk
  3.  **Output Generation**: Based ONLY on the REAL data fetched, provide a structured JSON response.

  **Location:**
  - Latitude: {{{latitude}}}
  - Longitude: {{{longitude}}}
  
  **Output Requirements:**
  Your response MUST be valid JSON only in format: {"summary":"..."}
  `,
});

export async function analyzeDroughtAndFloodRisk(input: DroughtFloodRiskInput): Promise<DroughtFloodRiskOutput> {
    const toolData = await getDroughtAndFloodRiskData(input);
    const modelRisk = predictDroughtFloodClassical({
        averagePrecipitationMm: toolData.averagePrecipitationMm,
        currentMoistureLevel: toolData.currentMoistureLevel,
    });

    const response = await executePromptWithFallback(analyzeDroughtAndFloodRiskPrompt, input, undefined, 'drought-flood');
    const textResponse = response.text;
    
    if (!textResponse) {
      return DroughtFloodRiskOutputSchema.parse({
        droughtRisk: modelRisk.droughtRisk,
        floodRisk: modelRisk.floodRisk,
        confidence: modelRisk.confidence,
        summary: `Deterministic assessment based on average precipitation (${toolData.averagePrecipitationMm.toFixed(0)}mm) and soil moisture (${toolData.currentMoistureLevel}).`,
      });
    }
    
    try {
        const parsedSummary = safeParseAIJson(textResponse, (data) => DroughtFloodSummarySchema.parse(data));
        return DroughtFloodRiskOutputSchema.parse({
          droughtRisk: modelRisk.droughtRisk,
          floodRisk: modelRisk.floodRisk,
          confidence: modelRisk.confidence,
          summary: parsedSummary.summary,
        });
    } catch (e) {
        return DroughtFloodRiskOutputSchema.parse({
          droughtRisk: modelRisk.droughtRisk,
          floodRisk: modelRisk.floodRisk,
          confidence: modelRisk.confidence,
          summary: `Deterministic assessment based on average precipitation (${toolData.averagePrecipitationMm.toFixed(0)}mm) and soil moisture (${toolData.currentMoistureLevel}).`,
        });
    }
}
