
'use server';

/**
 * @fileOverview A flow for getting real-time soil moisture based on location.
 *
 * - predictSoilMoisture - A function that fetches real soil moisture data.
 * - PredictSoilMoistureInput - The input type for the predictSoilMoisture function.
 * - PredictSoilMoistureOutput - The return type for the predictSoilMoisture function.
 */

import { z } from 'genkit';
import { getSoilAndWeatherData, getMoistureLevel, getSoilTypeName } from '@/services/open-meteo';

const PredictSoilMoistureInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),  soilData: z.string().optional().describe('Real soil data from Open-Meteo Soil API in JSON string format.'),});
export type PredictSoilMoistureInput = z.infer<typeof PredictSoilMoistureInputSchema>;

const PredictSoilMoistureOutputSchema = z.object({
    volumetricWaterContent: z.number().describe("The actual soil moisture as a percentage of volumetric water content (e.g., 25.5 for 25.5%)."),
    summary: z.string().describe("A brief summary of the soil moisture conditions (e.g., 'Optimal for germination', 'Slightly dry, consider irrigation')."),
    confidence: z.number().describe("A confidence score (0-1) for the data quality."),
});
export type PredictSoilMoistureOutput = z.infer<typeof PredictSoilMoistureOutputSchema>;

/**
 * Get moisture summary based on level
 */
function getMoistureSummary(level: 'Dry' | 'Optimal' | 'Wet', vwc: number, soilType: string): string {
  const summaries = {
    'Dry': `Soil is dry (${vwc.toFixed(1)}% VWC). ${soilType} soil type. Consider irrigation for most crops.`,
    'Optimal': `Soil moisture is optimal (${vwc.toFixed(1)}% VWC). ${soilType} soil type. Good conditions for plant growth.`,
    'Wet': `Soil is saturated (${vwc.toFixed(1)}% VWC). ${soilType} soil type. Avoid irrigation, watch for waterlogging.`
  };
  return summaries[level];
}

export async function predictSoilMoisture(input: PredictSoilMoistureInput): Promise<PredictSoilMoistureOutput> {
    try {
      // Fetch REAL data from Open-Meteo Soil API
      const data = await getSoilAndWeatherData(input.latitude, input.longitude);
      
      const vwc = data.current.soil_moisture_0_to_1cm;
      const moistureLevel = getMoistureLevel(vwc);
      const soilTypeIndex = data.hourly?.soil_type_0_to_10cm?.[0];
      const soilType = getSoilTypeName(soilTypeIndex);
      
      return {
        volumetricWaterContent: vwc,
        summary: getMoistureSummary(moistureLevel, vwc, soilType),
        confidence: 0.95 // Real data has high confidence
      };
    } catch (error) {
      console.error('Error fetching real soil moisture data:', error);
      throw new Error('Failed to fetch real-time soil moisture data. Please try again.');
    }
}
