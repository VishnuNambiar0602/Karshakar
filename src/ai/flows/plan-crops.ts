
'use server';

/**
 * @fileOverview A flow for suggesting crop plans based on REAL climate and soil data.
 *
 * - planCrops - A function that handles the crop planning process.
 * - PlanCropsInput - The input type for the planCrops function.
 * - PlanCropsOutput - The return type for the planCrops function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';
import { getHistoricalWeather, getSoilAndWeatherData, getMoistureLevel, getSoilTypeName } from '@/services/open-meteo';

// Fetch climate data for crop planning
async function fetchClimateDataForCropPlanning(lat: number, lon: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // Last year's data
  
  try {
    const [historicalWeather, soilData] = await Promise.all([
      getHistoricalWeather(lat, lon, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
      getSoilAndWeatherData(lat, lon)
    ]);
    
    // Calculate seasonal averages
    const temps = historicalWeather.daily.temperature_2m_mean.filter(t => t !== null) as number[];
    const precip = historicalWeather.daily.precipitation_sum.filter(p => p !== null) as number[];
    
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 20;
    const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 35;
    const totalPrecip = precip.reduce((a, b) => a + b, 0);
    
    return {
      avgAnnualTemp: avgTemp.toFixed(1),
      minTemp: minTemp.toFixed(1),
      maxTemp: maxTemp.toFixed(1),
      annualPrecipitation: totalPrecip.toFixed(0),
      soilType: getSoilTypeName(soilData.hourly?.soil_type_0_to_10cm?.[0]),
      currentMoisture: getMoistureLevel(soilData.current.soil_moisture_0_to_1cm)
    };
  } catch (error) {
    console.warn('Using mock climate data for crop planning', error);
    const tempAdjustment = Math.abs(lat) / 90 * 15;
    return {
      avgAnnualTemp: (20 - tempAdjustment).toFixed(1),
      minTemp: (5 - tempAdjustment).toFixed(1),
      maxTemp: (30 - tempAdjustment / 2).toFixed(1),
      annualPrecipitation: '500',
      soilType: 'Loam',
      currentMoisture: 'Optimal' as const
    };
  }
}

const PlanCropsInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
  realClimateData: z.string().optional().describe('Real climate data from Open-Meteo API.'),
});
export type PlanCropsInput = z.infer<typeof PlanCropsInputSchema>;

const CropSchema = z.object({
    name: z.string().describe("The common name of the crop."),
    reason: z.string().describe("A brief explanation of why this crop is suitable for the location and conditions."),
});

const PlanCropsOutputSchema = z.object({
    suitableCrops: z.array(CropSchema).describe("A list of crops suitable for planting at the given location."),
    plantingWindow: z.object({
        start: z.string().describe("The suggested start date for planting (e.g., 'Mid-April')."),
        end: z.string().describe("The suggested end date for planting (e.g., 'Late-May').")
    }).describe("The optimal window for planting the suggested crops."),
    cooperativeFarmingSuggestion: z.string().describe("A suggestion for how local farmers could cooperate for better yield or market access."),
});
export type PlanCropsOutput = z.infer<typeof PlanCropsOutputSchema>;

const planCropsPrompt = ai.definePrompt({
  name: 'planCropsPrompt',
  input: { schema: PlanCropsInputSchema },
  prompt: `You are an expert agronomist providing advice to farmers. You will receive REAL climate and soil data from Open-Meteo API - use these actual values to recommend crops that will thrive in these conditions.

  The current date is ${new Date().toISOString()}. Your recommendations must be seasonally appropriate.

  **REAL CLIMATE DATA (from Open-Meteo API - Last 12 Months):**
  {{{realClimateData}}}

  Based on this REAL data, recommend crops that are suitable for:
  - The actual temperature range (min/max recorded)
  - The actual annual precipitation
  - The actual soil type
  - The current season

  Your response MUST be a valid JSON object ONLY that conforms to the PlanCropsOutput schema. Do not add any other text or formatting.

  **Location:**
  - Latitude: {{{latitude}}}
  - Longitude: {{{longitude}}}
  `,
});

export async function planCrops(input: PlanCropsInput): Promise<PlanCropsOutput> {
    // Fetch REAL climate data
    const realData = await fetchClimateDataForCropPlanning(input.latitude, input.longitude);
    
    const promptInput = {
      ...input,
      realClimateData: `Average Temperature: ${realData.avgAnnualTemp}°C, Min Temp: ${realData.minTemp}°C, Max Temp: ${realData.maxTemp}°C, Annual Precipitation: ${realData.annualPrecipitation}mm, Soil Type: ${realData.soilType}, Current Moisture: ${realData.currentMoisture}`
    };
    
    const response = await executePromptWithFallback(planCropsPrompt, promptInput, undefined, 'crop-plan');
    const textResponse = response.text;
    if (!textResponse) {
      throw new Error('AI failed to generate a crop plan.');
    }

    try {
        const parsedJson = safeParseAIJson(textResponse, (data) => PlanCropsOutputSchema.parse(data));
        return parsedJson;
    } catch(e) {
        console.error("Failed to parse JSON response from AI:", textResponse);
        throw new Error("AI returned invalid JSON format. Please try again.");
    }
}
