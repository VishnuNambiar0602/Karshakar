
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { AnalyzeChangeOutput } from "@/ai/flows/analyze-change";

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export interface DataPoint {
  date: string; // Should be a date string that can be parsed by new Date()
  value: number | null;
}

export interface GroundTruthDataPoint {
  date: string;
  value: number;
}

export interface MetricData {
  name: string;
  timeSeries: DataPoint[];
  firstValue: number | null;
  lastValue: number | null;
  percentageChange: number | null;
  n: number;
  insight?: string;
  groundTruth?: GroundTruthDataPoint[];
}

export interface SatellitePassData {
    passTime: string;
    satelliteName: string;
    status: string;
    speed: number;
}

export interface HourlyForecast {
    time: string;
    temperature: number;
    conditions: string;
    iconName: string;
}

export interface WeatherData {
    current: {
        temperature: number;
        conditions: string;
        humidity: number;
        windSpeed: number;
        iconName: string;
    };
    forecast: HourlyForecast[];
    summary: string;
}

export interface HistoryEntry {
  id: string;
  lat: string;
  lon: string;
  locationDesc: string;
  dateRange?: DateRange;
  timestamp: Date;
}

export interface Crop {
    name: string;
    reason: string;
}

export interface CropPlan {
    suitableCrops: Crop[];
    plantingWindow: {
        start: string;
        end: string;
    };
    cooperativeFarmingSuggestion: string;
}


export interface IrrigationSchedule {
    recommendation: string;
    nextIrrigationDate: string;
    wateringDepthInches: number;
    notes: string;
}

export interface SoilMoisturePrediction {
    volumetricWaterContent: number;
    summary: string;
    confidence: number;
}

export interface CropYieldPrediction {
    predictedYield: number;
    crop: string;
    confidence: number;
    notes: string;
}

export interface SuggestCropInput {
    latitude: number;
    longitude: number;
    climateDescription: string;
    currentCrop?: string;
    language: string;
}

export interface SuggestCropOutput {
    suggestedCrop: string;
    suitabilityScore: number;
    reasoning: string;
    alternativeCrop?: string;
    fetchedSoilType: string;
    fetchedMoistureLevel: 'Dry' | 'Optimal' | 'Wet';
}


// New Types for Land Cover Analysis
export interface LandCoverStat {
  area: number;
}

export interface LandCoverChangeStat {
  startArea: number;
  endArea: number;
  absoluteChange: number;
  percentageChange: number;
}

export interface LandCoverAnalysis {
  vegetation: LandCoverChangeStat;
  water: LandCoverChangeStat;
  builtUp: LandCoverChangeStat;
  other: LandCoverChangeStat;
  beforeMapUrl: string;
  afterMapUrl: string;
}

export interface TimeSeriesData {
    NDVI: DataPoint[];
    NDWI: DataPoint[];
    NDBI: DataPoint[];
    NBR: DataPoint[];
    B1: DataPoint[];
    B2: DataPoint[];
    B3: DataPoint[];
    B4: DataPoint[];
    B5: DataPoint[];
    B6: DataPoint[];
    B7: DataPoint[];
    B8: DataPoint[];
    B8A: DataPoint[];
    B9: DataPoint[];
    B11: DataPoint[];
    B12: DataPoint[];
}

export interface HistoricalDataPoint {
  date: string;
  temperature: number | null;
  precipitation: number | null;
}

export interface AnalysisResult {
    timeSeries: TimeSeriesData;
    landCover: LandCoverAnalysis;
    historicalWeather: HistoricalDataPoint[];
    changeAnalysis?: AnalyzeChangeOutput; // Add this line
  segmentationInference?: {
    mask: number[];
    width: number;
    height: number;
    meanConfidence: number;
    classConfidence: Record<string, number>;
    postProcessing: {
      smoothingKernel: number;
      isolatedPixelFixes: number;
    };
    model: {
      modelId: string;
      version: string;
      configHash: string;
    };
  };
}

// New type for Drought & Flood Risk Analysis
export interface DroughtFloodRisk {
    droughtRisk: 'Low' | 'Medium' | 'High';
    floodRisk: 'Low' | 'Medium' | 'High';
    summary: string;
    confidence: number;
}

// New type for Advanced Crop Advice
export interface AdvancedCropAdvice {
    crop: string;
    plantingDensity: {
        value: number;
        unit: string; // e.g., 'seeds/hectare'
    };
    pestAndDiseaseRisks: {
        name: string;
        description: string;
    }[];
    fertilizationStrategy: {
        timing: string; // e.g., 'At planting', 'Top-dressing at 30 days'
        recommendation: string;
    }[];
    notes: string;
}

// New types for Timelapse Video Generation
export const GenerateTimelapseVideoInputSchema = z.object({
  metricName: z.string().describe('The name of the metric being visualized, e.g., NDVI.'),
  locationDescription: z.string().describe('A description of the location, e.g., Amazon Rainforest.'),
  startDate: z.string().describe('The start date of the time-lapse (e.g., "Jan 01, 2023").'),
  endDate: z.string().describe('The end date of the time-lapse (e.g., "Dec 31, 2023").'),
});
export type GenerateTimelapseVideoInput = z.infer<typeof GenerateTimelapseVideoInputSchema>;

export const GenerateTimelapseVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI in MP4 format.'),
});
export type GenerateTimelapseVideoOutput = z.infer<typeof GenerateTimelapseVideoOutputSchema>;

// New type for Scenario Analysis
export interface ScenarioAnalysis {
    scenario: string;
    likelyImpact: string;
    confidence: number;
}
