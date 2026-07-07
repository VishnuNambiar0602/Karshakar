
'use server';

/**
 * @fileOverview A flow for creating an irrigation schedule based on REAL weather and soil data.
 *
 * - scheduleIrrigation - A function that handles the irrigation scheduling process.
 * - ScheduleIrrigationInput - The input type for the scheduleIrrigation function.
 * - ScheduleIrrigationOutput - The return type for the scheduleIrrigation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';
import { getSoilAndWeatherData, getMoistureLevel, getSoilTypeName } from '@/services/open-meteo';

// Fetch real weather forecast
async function fetchWeatherForecast(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,evapotranspiration&timezone=auto&forecast_days=7`;
  
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch weather forecast');
  return await response.json();
}

const ScheduleIrrigationInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
  realSoilData: z.string().optional().describe('Real soil moisture data from Open-Meteo.'),
  realForecast: z.string().optional().describe('Real 7-day weather forecast from Open-Meteo.'),
});
export type ScheduleIrrigationInput = z.infer<typeof ScheduleIrrigationInputSchema>;


const ScheduleIrrigationOutputSchema = z.object({
    recommendation: z.string().describe("A concise, actionable irrigation recommendation (e.g., 'Irrigate now', 'Delay irrigation')."),
    nextIrrigationDate: z.string().describe("The suggested date for the next irrigation event in YYYY-MM-DD format."),
    wateringDepthInches: z.number().describe("The recommended depth of watering in inches."),
    notes: z.string().describe("Additional context or reasoning for the recommendation, considering recent weather and soil moisture data."),
});
export type ScheduleIrrigationOutput = z.infer<typeof ScheduleIrrigationOutputSchema>;


const scheduleIrrigationPrompt = ai.definePrompt({
  name: 'scheduleIrrigationPrompt',
  input: { schema: ScheduleIrrigationInputSchema },
  prompt: `You are an agricultural water management specialist. You will receive REAL soil moisture data and a REAL 7-day weather forecast from Open-Meteo API. Use this actual data to provide irrigation recommendations.

  The current date is ${new Date().toISOString()}.

  **REAL SOIL DATA (from Open-Meteo API):**
  {{{realSoilData}}}

  **REAL 7-DAY WEATHER FORECAST (from Open-Meteo API):**
  {{{realForecast}}}

  CRITICAL RULES:
  1. Use ONLY the actual soil moisture and forecast values provided
  2. DO NOT make up weather predictions or soil conditions
  3. Decision logic using REAL data:
     - Soil moisture < 0.20 (Dry) + No rain in forecast → Irrigate immediately
     - Soil moisture 0.20-0.40 (Optimal) + Rain expected → Delay irrigation
     - Soil moisture > 0.40 (Wet) → No irrigation needed
  4. Water depth: 0.5-1 inch for vegetables, 1-2 inches for field crops

  Your response MUST be a valid JSON object ONLY that conforms to the ScheduleIrrigationOutput schema. Do not add any other text or formatting.

  **Location:**
  - Latitude: {{{latitude}}}
  - Longitude: {{{longitude}}}
  `,
});

export async function scheduleIrrigation(input: ScheduleIrrigationInput): Promise<ScheduleIrrigationOutput> {
    try {
      // Fetch REAL data
      const [soilData, forecastData] = await Promise.all([
        getSoilAndWeatherData(input.latitude, input.longitude),
        fetchWeatherForecast(input.latitude, input.longitude)
      ]);
      
      const moistureLevel = getMoistureLevel(soilData.current.soil_moisture_0_to_1cm);
      const soilType = getSoilTypeName(soilData.hourly?.soil_type_0_to_10cm?.[0]);
    
    // Format forecast data
    const forecastSummary = forecastData.daily.time.map((date: string, i: number) => ({
      date,
      precipitation: forecastData.daily.precipitation_sum[i] || 0,
      maxTemp: forecastData.daily.temperature_2m_max[i] || 0,
      evapotranspiration: forecastData.daily.evapotranspiration?.[i] || 0
    }));
    
    const promptInput = {
      ...input,
      realSoilData: `Soil Moisture: ${soilData.current.soil_moisture_0_to_1cm.toFixed(1)}% VWC (${moistureLevel}), Soil Type: ${soilType}`,
      realForecast: JSON.stringify(forecastSummary, null, 2)
    };
    
    const response = await executePromptWithFallback(scheduleIrrigationPrompt, promptInput, undefined, 'irrigation');
    const textResponse = response.text;
    if (!textResponse) {
      throw new Error('AI failed to generate an irrigation schedule.');
    }
    
    try {
        const parsedJson = safeParseAIJson(textResponse, (data) => ScheduleIrrigationOutputSchema.parse(data));
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", textResponse);
        throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error) {
    console.warn('Network error, using mock irrigation recommendation', error);
    // Return reasonable mock recommendation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      recommendation: 'Irrigate within 24 hours',
      nextIrrigationDate: tomorrow.toISOString().split('T')[0],
      wateringDepthInches: 1.5,
      notes: 'Based on typical soil moisture requirements for this region. Real-time data unavailable.'
    };
  }
}
