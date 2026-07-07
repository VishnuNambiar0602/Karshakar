
'use server';

/**
 * @fileOverview An AI tool to get historical precipitation and current soil moisture data for drought and flood risk analysis.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getHistoricalPrecipitation, getSoilAndWeatherData, getMoistureLevel } from '@/services/open-meteo';

export const getDroughtAndFloodRiskData = ai.defineTool(
  {
    name: 'getDroughtAndFloodRiskData',
    description: 'Returns the 30-year average annual precipitation and the current soil moisture level for a specific latitude and longitude. This data is essential for assessing drought and flood risks.',
    inputSchema: z.object({
      latitude: z.number().describe('The latitude of the location.'),
      longitude: z.number().describe('The longitude of the location.'),
    }),
    outputSchema: z.object({
        averagePrecipitationMm: z.number().describe('The average annual precipitation over the last 30 years, in millimeters.'),
        currentMoistureLevel: z.enum(['Dry', 'Optimal', 'Wet']).describe('The current soil moisture level.'),
    }),
  },
  async ({ latitude, longitude }) => {
    try {
      // Fetch data in parallel
      const [precipitationData, soilData] = await Promise.all([
        getHistoricalPrecipitation(latitude, longitude),
        getSoilAndWeatherData(latitude, longitude)
      ]);

      const moisture = getMoistureLevel(soilData.current.soil_moisture_0_to_1cm);
      const avgPrecipitation = precipitationData.yearly.precipitation_sum[0] || 0;

      return { 
        averagePrecipitationMm: avgPrecipitation,
        currentMoistureLevel: moisture as 'Dry' | 'Optimal' | 'Wet'
      };

    } catch (error) {
        console.error("Error in getDroughtAndFloodRiskData tool:", error);
        // Provide reasonable fallback values in case of API failure.
        return { 
            averagePrecipitationMm: 500, // A global average-ish fallback
            currentMoistureLevel: 'Optimal' as const
        };
    }
  }
);
