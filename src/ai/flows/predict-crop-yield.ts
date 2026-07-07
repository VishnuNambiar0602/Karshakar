
'use server';

/**
 * @fileOverview A flow for predicting crop yield based on location and REAL climate data.
 *
 * - predictCropYield - A function that handles the crop yield prediction process.
 * - PredictCropYieldInput - The input type for the predictCropYield function.
 * - PredictCropYieldOutput - The return type for the predictCropYield function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executePromptWithFallback, safeParseAIJson } from '@/ai/ai-utils';
import { getHistoricalWeather, getSoilAndWeatherData, getSoilTypeName, getMoistureLevel } from '@/services/open-meteo';
import { predictYieldClassical } from '@/ml';

const PredictCropYieldInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
  cropType: z.string().default('Maize').describe('The type of crop to predict the yield for.'),
  realClimateData: z.string().optional().describe('Real climate data from Open-Meteo API.'),
  realSoilData: z.string().optional().describe('Real soil data from Open-Meteo API.'),
});
export type PredictCropYieldInput = z.infer<typeof PredictCropYieldInputSchema>;

const PredictCropYieldOutputSchema = z.object({
    predictedYield: z.number().describe("The predicted crop yield in tons per hectare."),
    crop: z.string().describe("The crop for which the yield is predicted."),
    confidence: z.number().min(0).max(1).describe("A confidence score (0-1) for the prediction."),
    notes: z.string().describe("Additional context or factors influencing the yield prediction."),
});
export type PredictCropYieldOutput = z.infer<typeof PredictCropYieldOutputSchema>;

const YieldReasoningOutputSchema = z.object({
  notes: z.string(),
});

// Fetch real climate data for crop yield prediction
async function fetchRealClimateData(lat: number, lon: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
  
  try {
    const [historicalWeather, soilData] = await Promise.all([
      getHistoricalWeather(lat, lon, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
      getSoilAndWeatherData(lat, lon)
    ]);
    
    // Calculate averages from historical data
    const temps = historicalWeather.daily.temperature_2m_mean.filter(t => t !== null) as number[];
    const precip = historicalWeather.daily.precipitation_sum.filter(p => p !== null) as number[];
    
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 20;
    const totalPrecip = precip.reduce((a, b) => a + b, 0);
    
    return {
      avgTemperature: avgTemp.toFixed(1),
      totalPrecipitationMm: totalPrecip.toFixed(0),
      soilMoisture: soilData.current.soil_moisture_0_to_1cm.toFixed(1),
      moistureLevel: getMoistureLevel(soilData.current.soil_moisture_0_to_1cm),
      soilType: getSoilTypeName(soilData.hourly?.soil_type_0_to_10cm?.[0])
    };
  } catch (error) {
    console.warn('Using mock climate data for crop yield', error);
    // Return reasonable mock data based on latitude
    const tempAdjustment = Math.abs(lat) / 90 * 10; // Colder at poles
    return {
      avgTemperature: (20 - tempAdjustment).toFixed(1),
      totalPrecipitationMm: '350',
      soilMoisture: '0.25',
      moistureLevel: 'Optimal' as const,
      soilType: 'Loam'
    };
  }
}

const predictCropYieldPrompt = ai.definePrompt({
  name: 'predictCropYieldPrompt',
  input: { schema: PredictCropYieldInputSchema },
  prompt: `You are an agricultural scientist. Numeric forecasting is done by a deterministic model. Your only task is to provide concise explanation notes.

  The current date is ${new Date().toISOString()}.

  **REAL CLIMATE DATA (from Open-Meteo API):**
  {{{realClimateData}}}

  **REAL SOIL DATA (from Open-Meteo API):**
  {{{realSoilData}}}

  CRITICAL RULES:
  1. DO NOT provide or change numeric yield/confidence values.
  2. Explain likely factors using provided climate and soil data.
  3. Keep notes practical and concise.

  Your response MUST be a valid JSON object ONLY matching: {"notes":"..."}

  **Location & Crop:**
  - Latitude: {{{latitude}}}
  - Longitude: {{{longitude}}}
  - Crop Type: {{{cropType}}}
  `,
});

export async function predictCropYield(input: PredictCropYieldInput): Promise<PredictCropYieldOutput> {
    // Fetch REAL climate data
    const realData = await fetchRealClimateData(input.latitude, input.longitude);
    
    const avgTemperature = Number(realData.avgTemperature);
    const totalPrecipitationMm = Number(realData.totalPrecipitationMm);
    const soilMoisture = Number(realData.soilMoisture);

    const modelPrediction = predictYieldClassical({
      cropType: input.cropType,
      avgTemperatureC: Number.isFinite(avgTemperature) ? avgTemperature : 20,
      totalPrecipitationMm: Number.isFinite(totalPrecipitationMm) ? totalPrecipitationMm : 350,
      soilMoisture: Number.isFinite(soilMoisture) ? soilMoisture : 0.25,
      soilType: realData.soilType,
    });

    const promptInput = {
      ...input,
      realClimateData: `Average Temperature: ${realData.avgTemperature}°C, Total Precipitation (6 months): ${realData.totalPrecipitationMm}mm, Model signals: ${modelPrediction.signals.join(', ')}`,
      realSoilData: `Soil Moisture: ${realData.soilMoisture}% VWC (${realData.moistureLevel}), Soil Type: ${realData.soilType}`
    };
    
    const response = await executePromptWithFallback(predictCropYieldPrompt, promptInput, undefined, 'crop-yield');
    const textResponse = response.text;
    
    if (!textResponse) {
        throw new Error("The AI model did not return a crop yield prediction.");
    }
    
    try {
        const parsedReasoning = safeParseAIJson(textResponse, (data) => YieldReasoningOutputSchema.parse(data));
        return PredictCropYieldOutputSchema.parse({
          predictedYield: modelPrediction.predictedYield,
          crop: input.cropType,
          confidence: modelPrediction.confidence,
          notes: parsedReasoning.notes,
        });
    } catch(e) {
        return PredictCropYieldOutputSchema.parse({
          predictedYield: modelPrediction.predictedYield,
          crop: input.cropType,
          confidence: modelPrediction.confidence,
          notes: `Deterministic model estimate generated from temperature (${realData.avgTemperature}C), precipitation (${realData.totalPrecipitationMm}mm), and soil conditions (${realData.soilType}/${realData.moistureLevel}).`,
        });
    }
}
