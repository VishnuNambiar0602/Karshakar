import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ComputeMetricsInputActionSchema = CoordinatesSchema.extend({
  startDate: DateStringSchema,
  endDate: DateStringSchema,
});

export const ChatbotMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const ChatbotInputActionSchema = z.object({
  messages: z.array(ChatbotMessageSchema),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const SuggestCoordinatesActionSchema = z.object({
  locationDescription: z.string().min(2).max(400),
});

export const GenerateReportActionSchema = z.object({
  metricsData: z.string().min(1),
  location: z.string().min(1),
  dateRange: z.string().min(1),
});

export const TextToSpeechActionSchema = z.object({
  text: z.string().min(1).max(6000),
});

export const PredictCropYieldActionSchema = CoordinatesSchema.extend({
  cropType: z.string().default('Maize'),
});

export const ScenarioAnalysisActionSchema = CoordinatesSchema.extend({
  scenarioDescription: z.string().min(3).max(1200),
});

export const AdvancedCropAdviceActionSchema = z.object({
  crop: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  climateDescription: z.string(),
  language: z.string().default('en'),
});

export const TimelapseVideoActionSchema = z.object({
  metricName: z.string().min(1),
  locationDescription: z.string().min(1),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
});

export const SuggestCropActionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  climateDescription: z.string(),
  currentCrop: z.string().optional(),
  language: z.string().default('en'),
});
