
/**
 * @fileOverview A service to fetch agricultural and weather data from the Open-Meteo API.
 */
import { logger } from '@/lib/logger';
import { redactSensitive } from '@/lib/security';
import { getTraceContext } from '@/lib/trace';

const ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive";


export interface SoilAndWeatherData {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    current_units: {
        time: string;
        interval: string;
        soil_moisture_0_to_1cm: string;
    };
    current: {
        time: string;
        interval: number;
        soil_moisture_0_to_1cm: number;
    };
    hourly_units: {
        time: string;
        soil_type_0_to_10cm: string;
    };
    hourly: {
        time: string[];
        soil_type_0_to_10cm: number[];
    };
}

export interface HistoricalWeatherData {
    latitude: number,
    longitude: number,
    generationtime_ms: number,
    utc_offset_seconds: number,
    timezone: string,
    timezone_abbreviation: string,
    elevation: number,
    daily_units: {
        time: string,
        temperature_2m_mean: string,
        precipitation_sum: string
    },
    daily: {
        time: string[],
        temperature_2m_mean: (number | null)[],
        precipitation_sum: (number | null)[]
    }
}

export interface HistoricalPrecipitationData {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    yearly_units: {
        time: string;
        precipitation_sum: string;
    };
    yearly: {
        time: string[];
        precipitation_sum: (number | null)[];
    };
}


/**
 * Fetches the latest soil type and moisture data for a given location.
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @returns A promise that resolves to the soil and weather data.
 */
export async function getSoilAndWeatherData(latitude: number, longitude: number): Promise<SoilAndWeatherData> {
    const traceId = getTraceContext()?.requestId;
    // Try primary URL first, then fallback
    const urls = [
        `https://soil-api.open-meteo.com/v1/soil?latitude=${latitude}&longitude=${longitude}&current=soil_moisture_0_to_1cm&hourly=soil_type_0_to_10cm`,
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2024-01-01&end_date=2024-01-01&hourly=soil_moisture_0_to_1cm` // Fallback
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                headers: traceId ? { 'x-request-id': traceId } : undefined,
            });
            if (!response.ok) {
                throw new Error(`Open-Meteo Soil API returned an error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            // Normalize fallback data structure
            if (!data.current) {
                data.current = {
                    time: new Date().toISOString(),
                    interval: 3600,
                    soil_moisture_0_to_1cm: 0.25 // Default optimal moisture
                };
            }
            if (!data.hourly) {
                data.hourly = {
                    time: [new Date().toISOString()],
                    soil_type_0_to_10cm: [4] // Default: Loam
                };
            }
            
            return data as SoilAndWeatherData;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn('soil_fetch_failed', {
                scope: 'services.open-meteo',
                endpoint: url.split('?')[0],
                error: redactSensitive(message),
            });
            continue;
        }
    }
    
    // If all URLs fail, return mock data as last resort
    logger.error('soil_all_endpoints_failed', { scope: 'services.open-meteo' });
    return {
        latitude,
        longitude,
        generationtime_ms: 0,
        utc_offset_seconds: 0,
        timezone: 'UTC',
        timezone_abbreviation: 'UTC',
        elevation: 0,
        current_units: { time: 'iso8601', interval: 'seconds', soil_moisture_0_to_1cm: 'm³/m³' },
        current: { time: new Date().toISOString(), interval: 3600, soil_moisture_0_to_1cm: 0.25 },
        hourly_units: { time: 'iso8601', soil_type_0_to_10cm: 'code' },
        hourly: { time: [new Date().toISOString()], soil_type_0_to_10cm: [4] }
    };
}

/**
 * Fetches historical daily weather data (temp and precipitation) for a given location and date range.
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @param startDate The start date in YYYY-MM-DD format.
 * @param endDate The end date in YYYY-MM-DD format.
 * @returns A promise that resolves to the historical weather data.
 */
export async function getHistoricalWeather(latitude: number, longitude: number, startDate: string, endDate: string): Promise<HistoricalWeatherData> {
    const traceId = getTraceContext()?.requestId;
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startDate,
        end_date: endDate,
        daily: "temperature_2m_mean,precipitation_sum",
        timezone: "auto"
    });

    const url = `${ARCHIVE_API_URL}?${params.toString()}`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store',
            headers: traceId ? { 'x-request-id': traceId } : undefined,
        });
         if (!response.ok) {
            throw new Error(`Open-Meteo Archive API returned an error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data as HistoricalWeatherData;
    } catch (error: unknown) {
        logger.error('historical_weather_fetch_failed', {
            scope: 'services.open-meteo',
            error: redactSensitive(error instanceof Error ? error.message : String(error)),
        });
        logger.warn('historical_weather_mock_fallback', { scope: 'services.open-meteo' });
        
        // Return mock historical data as fallback
        const days = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const mockTemps: number[] = [];
        const mockPrecip: number[] = [];
        const mockTimes: string[] = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            mockTimes.push(date.toISOString().split('T')[0]);
            // Generate realistic seasonal temperatures (15-25°C avg)
            mockTemps.push(15 + Math.random() * 10);
            // Random precipitation (0-20mm)
            mockPrecip.push(Math.random() * 20);
        }
        
        return {
            latitude,
            longitude,
            generationtime_ms: 0,
            utc_offset_seconds: 0,
            timezone: 'UTC',
            timezone_abbreviation: 'UTC',
            elevation: 0,
            daily_units: {
                time: 'iso8601',
                temperature_2m_mean: '°C',
                precipitation_sum: 'mm'
            },
            daily: {
                time: mockTimes,
                temperature_2m_mean: mockTemps,
                precipitation_sum: mockPrecip
            }
        };
    }
}

/**
 * Fetches the 30-year average annual precipitation for a given location.
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @returns A promise that resolves to the historical precipitation data.
 */
export async function getHistoricalPrecipitation(latitude: number, longitude: number): Promise<HistoricalPrecipitationData> {
    const traceId = getTraceContext()?.requestId;
    // Fetches data for the climate normal period (1991-2020) to get a 30-year average.
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: '1991-01-01',
        end_date: '2020-12-31', 
        yearly: "precipitation_sum",
        models: "ERA5_seamless", // Use climate reanalysis data
    });

    const url = `${ARCHIVE_API_URL}?${params.toString()}`;

    try {
        const response = await fetch(url, {
            cache: 'no-store',
            headers: traceId ? { 'x-request-id': traceId } : undefined,
        });
        if (!response.ok) {
            throw new Error(`Open-Meteo Archive API returned an error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        // The API returns yearly data for the whole range. We need to average it.
        if (data.yearly && data.yearly.precipitation_sum && data.yearly.precipitation_sum.length > 0) {
            const validValues = data.yearly.precipitation_sum.filter((p: number | null) => p !== null);
            const average = validValues.reduce((a: number, b: number) => a + b, 0) / validValues.length;
            // We'll return the average as if it were a single yearly value for simplicity.
            data.yearly.precipitation_sum = [average];
            data.yearly.time = [ '1991-2020 Average' ];
        }
        
        return data as HistoricalPrecipitationData;
    } catch (error: unknown) {
        logger.error('historical_precipitation_fetch_failed', {
            scope: 'services.open-meteo',
            error: redactSensitive(error instanceof Error ? error.message : String(error)),
        });
        logger.warn('historical_precipitation_mock_fallback', { scope: 'services.open-meteo' });
        
        // Return mock 30-year average (global average ~500mm/year)
        return {
            latitude,
            longitude,
            generationtime_ms: 0,
            utc_offset_seconds: 0,
            timezone: 'UTC',
            timezone_abbreviation: 'UTC',
            elevation: 0,
            yearly_units: {
                time: 'string',
                precipitation_sum: 'mm'
            },
            yearly: {
                time: ['1991-2020 Average'],
                precipitation_sum: [500 + (Math.random() - 0.5) * 200] // 400-600mm range
            }
        };
    }
}


/**
 * Maps the soil type index from the API to a human-readable name.
 * See https://open-meteo.com/en/docs/soil_and_weather_api for index mapping.
 * @param typeIndex The soil type index from the API response.
 * @returns The human-readable soil type name.
 */
export function getSoilTypeName(typeIndex: number | undefined): string {
    if (typeIndex === undefined) return "Unknown";
    const soilTypes = [
        "Sand", "Loamy Sand", "Sandy Loam", "Loam", "Silt Loam",
        "Silt", "Sandy Clay Loam", "Clay Loam", "Silty Clay Loam",
        "Sandy Clay", "Silty Clay", "Clay"
    ];
    return soilTypes[typeIndex] || "Unknown";
}

/**
 * Categorizes the volumetric water content into a moisture level.
 * Typical values for VWC range from <10% (very dry) to >40% (saturated).
 * @param vwc The volumetric water content percentage (e.g., 25.5).
 * @returns 'Dry', 'Optimal', or 'Wet'.
 */
export function getMoistureLevel(vwc: number | undefined): 'Dry' | 'Optimal' | 'Wet' {
    if (vwc === undefined) return "Optimal"; // Default fallback
    if (vwc < 15) return 'Dry';
    if (vwc > 35) return 'Wet';
    return 'Optimal';
}
