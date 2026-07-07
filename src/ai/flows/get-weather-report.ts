
'use server';

/**
 * @fileOverview A flow for getting the current weather report for a given location.
 * NOW USES 100% REAL DATA - NO AI FORMATTING
 */

import {z} from 'genkit';
import { getCache, setCache } from '@/ai/cache';

// Real-time weather data fetching
async function fetchRealWeatherData(latitude: number, longitude: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`;
  
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  return await response.json();
}

// Map weather codes to icon names and descriptions
function getWeatherInfo(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: 'Sun', description: 'Clear sky' };
  if (code <= 3) return { icon: 'Cloudy', description: 'Partly cloudy' };
  if (code <= 48) return { icon: 'CloudFog', description: 'Foggy' };
  if (code <= 57) return { icon: 'CloudDrizzle', description: 'Drizzle' };
  if (code <= 67) return { icon: 'CloudRain', description: 'Rain' };
  if (code <= 77) return { icon: 'CloudSnow', description: 'Snow' };
  if (code <= 82) return { icon: 'CloudRain', description: 'Rain showers' };
  if (code <= 86) return { icon: 'CloudSnow', description: 'Snow showers' };
  return { icon: 'CloudLightning', description: 'Thunderstorm' };
}

const GetWeatherReportInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherReportInput = z.infer<typeof GetWeatherReportInputSchema>;

const HourlyForecastSchema = z.object({
    time: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    iconName: z.string(),
});

const GetWeatherReportOutputSchema = z.object({
    current: z.object({
      temperature: z.number(),
      conditions: z.string(),
      humidity: z.number(),
      windSpeed: z.number(),
      iconName: z.string(),
    }),
    forecast: z.array(HourlyForecastSchema),
    summary: z.string(),
});
export type GetWeatherReportOutput = z.infer<typeof GetWeatherReportOutputSchema>;

// Simple logging function
const verbose = (msg: string) => process.env.NODE_ENV === 'development' && console.log(msg);

export async function getWeatherReport(input: GetWeatherReportInput): Promise<GetWeatherReportOutput> {
    const cacheKey = `weather-report-${input.latitude}-${input.longitude}`;
    const cacheResult = getCache<GetWeatherReportOutput>(cacheKey);

    if (cacheResult.state === 'hit') {
      verbose(`[WEATHER] Using cached data for ${input.latitude}, ${input.longitude}`);
      return cacheResult.data;
    }

    // Fetch REAL weather data from Open-Meteo API
    verbose(`[WEATHER] Fetching REAL data from Open-Meteo for ${input.latitude}, ${input.longitude}`);
    const realWeatherData = await fetchRealWeatherData(input.latitude, input.longitude);
    
    // Parse REAL data directly - NO AI FORMATTING
    const currentWeather = getWeatherInfo(realWeatherData.current.weather_code);
    
    const result: GetWeatherReportOutput = {
      current: {
        temperature: realWeatherData.current.temperature_2m,
        conditions: currentWeather.description,
        humidity: realWeatherData.current.relative_humidity_2m,
        windSpeed: realWeatherData.current.wind_speed_10m,
        iconName: currentWeather.icon,
      },
      forecast: [],
      summary: `Current conditions: ${currentWeather.description} with ${realWeatherData.current.temperature_2m.toFixed(1)}°C`,
    };
    
    // Parse hourly forecast (next 12 hours)
    const now = new Date();
    for (let i = 0; i < Math.min(12, realWeatherData.hourly.time.length); i++) {
      const hourTime = new Date(realWeatherData.hourly.time[i]);
      if (hourTime > now) {
        const hourWeather = getWeatherInfo(realWeatherData.hourly.weather_code[i]);
        result.forecast.push({
          time: hourTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          temperature: realWeatherData.hourly.temperature_2m[i],
          conditions: hourWeather.description,
          iconName: hourWeather.icon,
        });
      }
    }
    
    verbose(`[WEATHER] ✓ Real data parsed: ${result.current.temperature}°C, ${result.current.conditions}`);
    setCache(cacheKey, result);
    return result;
}
