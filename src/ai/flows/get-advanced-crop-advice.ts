
'use server';

/**
 * @fileOverview A flow for providing advanced, crop-specific agricultural advice.
 * This flow uses tools to fetch real-time soil data before making recommendations.
 * - getAdvancedCropAdvice - A function that provides detailed advice for a specific crop.
 * - AdvancedCropAdviceInput - The input type for the function.
 * - AdvancedCropAdviceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { getSoilMoisture } from '@/ai/tools/get-soil-moisture';
import { getSoilType } from '@/ai/tools/get-soil-type';
import { z } from 'genkit';
import type { AdvancedCropAdvice } from '@/lib/types';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';
import { getHistoricalWeather, getSoilAndWeatherData } from '@/services/open-meteo';

// Fetch real-time climate data to validate and enrich the climate description
async function fetchRealClimateData(lat: number, lon: number) {
  // Get current weather conditions
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
  const weatherResponse = await fetch(weatherUrl, { cache: 'no-store' });
  const weatherData = await weatherResponse.json();
  
  // Get 3-month historical data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  const historicalData = await getHistoricalWeather(
    lat, 
    lon, 
    startDate.toISOString().split('T')[0], 
    endDate.toISOString().split('T')[0]
  );
  
  // Calculate climate stats
  const temps = historicalData.daily.temperature_2m_mean.filter(t => t !== null) as number[];
  const precip = historicalData.daily.precipitation_sum.filter(p => p !== null) as number[];
  
  return {
    currentTemp: weatherData.current.temperature_2m,
    avgTemp3Month: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 'N/A',
    totalPrecip3Month: precip.reduce((a, b) => a + b, 0).toFixed(0),
    forecast7Day: weatherData.daily,
  };
}

const AdvancedCropAdviceInputSchema = z.object({
  latitude: z.number().describe('The latitude of the farm location.'),
  longitude: z.number().describe('The longitude of the farm location.'),
  climateDescription: z.string().describe("A brief description of the local climate."),
  crop: z.string().describe('The specific crop for which advice is being sought (e.g., "Corn", "Wheat").'),
  language: z.string().optional().default('en').describe('The language for the output reasoning (e.g., "en", "hi", "es").'),
  realClimateData: z.string().optional().describe('Real-time climate data from Open-Meteo API.'),
});
export type AdvancedCropAdviceInput = z.infer<typeof AdvancedCropAdviceInputSchema>;


const PestOrDiseaseRiskSchema = z.object({
    name: z.string().describe("The common name of the pest or disease."),
    description: z.string().describe("A brief description of the risk and potential mitigation strategies."),
});

const FertilizationStrategySchema = z.object({
    timing: z.string().describe("The recommended timing for application (e.g., 'At planting', 'At tillering stage')."),
    recommendation: z.string().describe("The specific fertilizer recommendation (e.g., 'Apply a balanced NPK fertilizer')."),
});

const AdvancedCropAdviceOutputSchema = z.object({
    crop: z.string(),
    plantingDensity: z.object({
        value: z.number().describe("The numerical value for planting density."),
        unit: z.string().describe("The unit for planting density, e.g., 'seeds/hectare' or 'plants/sq. meter'."),
    }),
    pestAndDiseaseRisks: z.array(PestOrDiseaseRiskSchema).describe("A list of 2-3 potential pest and disease risks for the crop in this region."),
    fertilizationStrategy: z.array(FertilizationStrategySchema).describe("A list of key fertilization recommendations for different growth stages."),
    notes: z.string().describe("A summary note that ties the advice together, explicitly mentioning the fetched soil and moisture data."),
});
export type AdvancedCropAdviceOutput = z.infer<typeof AdvancedCropAdviceOutputSchema>;


const getAdvancedCropAdvicePrompt = ai.definePrompt({
  name: 'advancedCropAdvicePrompt',
  input: { schema: AdvancedCropAdviceInputSchema },
  tools: [getSoilMoisture, getSoilType],
  prompt: `You are a world-class agronomist AI providing detailed, actionable advice using REAL-TIME DATA.

  **Process:**
  1.  **Mandatory Data Fetching**: You MUST use the 'getSoilType' and 'getSoilMoisture' tools for the given coordinates to get REAL soil data.
  2.  **Real Climate Data**: You will receive REAL climate measurements including current temperature, 3-month averages, and precipitation data.
  3.  **Climate Validation**: Compare the farmer's climate description with the REAL data to provide accurate, localized advice.
  4.  **Language Adaptation**: All output text MUST be in the requested language: {{{language}}}

  **REAL CLIMATE DATA (from Open-Meteo API):**
  {{{realClimateData}}}

  **Farm Parameters:**
  - Crop: {{{crop}}}
  - Location: Latitude {{{latitude}}}, Longitude {{{longitude}}}
  - Farmer's Climate Description: {{{climateDescription}}}
  - Output Language: {{{language}}}

  **Instructions:**
  - Use the REAL climate data (temperature, precipitation) to validate the climate description
  - Adapt pest/disease risks based on ACTUAL current weather conditions
  - Adjust fertilization timing based on REAL temperature trends
  - Consider ACTUAL soil moisture levels (from getSoilMoisture tool) for irrigation advice
  - Tailor planting density to the REAL soil type (from getSoilType tool)

  **Output Requirements:**
  Your response MUST be a valid JSON object ONLY that conforms to the AdvancedCropAdviceOutput schema. No other text.
  `,
});

export async function getAdvancedCropAdvice(input: AdvancedCropAdviceInput): Promise<AdvancedCropAdvice> {
    // Fetch REAL climate data to enrich the analysis
    const realClimateData = await fetchRealClimateData(input.latitude, input.longitude);
    
    // Prepare input with real climate data
    const enrichedInput = {
      ...input,
      realClimateData: JSON.stringify(realClimateData, null, 2)
    };
    
    const response = await executePromptWithFallback(getAdvancedCropAdvicePrompt, enrichedInput, undefined, 'crop-advice');
    const textResponse = response.text;
    
    if (!textResponse) {
      throw new Error("The AI model did not return an output for advanced crop advice. Please try again.");
    }

    try {
        const parsedJson = safeParseAIJson(textResponse, (data) => AdvancedCropAdviceOutputSchema.parse(data));
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", textResponse);
        throw new Error("AI returned invalid JSON format. Please try again.");
    }
}
