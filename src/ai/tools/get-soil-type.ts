
'use server';
import 'server-only';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSoilAndWeatherData, getSoilTypeName } from '@/services/open-meteo';
import { getCache, setCache } from '@/ai/cache';
import { logger } from '@/lib/logger';
import { redactSensitive } from '@/lib/security';

export const getSoilType = ai.defineTool(
  {
    name: 'getSoilType',
    description: 'Returns the soil type (e.g., Loam, Clay, Sand) for a specific latitude and longitude by fetching real-time data from a soil API.',
    inputSchema: z.object({
      latitude: z.number().describe('The latitude of the location.'),
      longitude: z.number().describe('The longitude of the location.'),
    }),
    outputSchema: z.object({
        soilType: z.string().describe('The determined soil type.')
    }),
  },
  async ({ latitude, longitude }) => {
    const cacheKey = `soil-type-${latitude}-${longitude}`;
    const cacheResult = getCache<{ soilType: string }>(cacheKey);

    if (cacheResult.state === 'hit') {
      return cacheResult.data;
    }
    
    if (cacheResult.state === 'stale') {
      logger.info('soil_type_cache_stale', { scope: 'ai.tools.get-soil-type', latitude, longitude });
        // Non-blocking call to refresh the cache in the background
      getSoilAndWeatherData(latitude, longitude).then(data => {
            const soilTypeIndex = data.hourly.soil_type_0_to_10cm[0];
            const soilName = getSoilTypeName(soilTypeIndex);
            setCache(cacheKey, { soilType: soilName });
      }).catch((err: unknown) => {
        logger.error('soil_type_cache_refresh_failed', {
          scope: 'ai.tools.get-soil-type',
          latitude,
          longitude,
          error: redactSensitive(err instanceof Error ? err.message : String(err)),
        });
      });
        return cacheResult.data;
    }

     try {
      // Fetch real data from the Open-Meteo service
      const data = await getSoilAndWeatherData(latitude, longitude);
      
      // The API returns an array of hourly data, we can take the first one.
      const soilTypeIndex = data.hourly.soil_type_0_to_10cm[0];
      
      // Use the helper function to get the human-readable name
      const soilName = getSoilTypeName(soilTypeIndex);

      const result = { soilType: soilName };
      setCache(cacheKey, result);

      return result;
    } catch (error) {
      logger.error('soil_type_tool_failed', {
        scope: 'ai.tools.get-soil-type',
        error: redactSensitive(error instanceof Error ? error.message : String(error)),
      });
        // Provide a fallback value in case of API failure to ensure the flow can continue.
        return { soilType: 'Loam' };
    }
  }
);
