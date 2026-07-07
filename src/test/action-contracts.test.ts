import { describe, expect, it } from 'vitest';
import {
  AdvancedCropAdviceActionSchema,
  ChatbotInputActionSchema,
  ComputeMetricsInputActionSchema,
  CoordinatesSchema,
  DateStringSchema,
  GenerateReportActionSchema,
  PredictCropYieldActionSchema,
  ScenarioAnalysisActionSchema,
  SuggestCoordinatesActionSchema,
  SuggestCropActionSchema,
  TextToSpeechActionSchema,
  TimelapseVideoActionSchema,
} from '@/lib/action-schemas';

describe('action contract schemas', () => {
  it('accepts valid coordinate payloads', () => {
    expect(CoordinatesSchema.parse({ latitude: 10.3, longitude: 75.2 })).toBeTruthy();
  });

  it('rejects invalid date format', () => {
    expect(() => DateStringSchema.parse('2026/01/01')).toThrow();
  });

  it('parses compute metrics input', () => {
    expect(
      ComputeMetricsInputActionSchema.parse({ latitude: 11, longitude: 72, startDate: '2026-01-01', endDate: '2026-02-01' })
    ).toBeTruthy();
  });

  it('parses chatbot input', () => {
    expect(
      ChatbotInputActionSchema.parse({
        messages: [{ role: 'user', content: 'hello' }],
      })
    ).toBeTruthy();
  });

  it('parses report generation input', () => {
    expect(
      GenerateReportActionSchema.parse({ metricsData: 'x', location: 'loc', dateRange: '2026-01-01 to 2026-01-30' })
    ).toBeTruthy();
  });

  it('parses timelapse input', () => {
    expect(
      TimelapseVideoActionSchema.parse({
        metricName: 'NDVI',
        locationDescription: 'NYC',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
      })
    ).toBeTruthy();
  });

  it('parses suggest/input schemas with defaults', () => {
    expect(SuggestCoordinatesActionSchema.parse({ locationDescription: 'Delhi' })).toBeTruthy();
    expect(
      SuggestCropActionSchema.parse({ latitude: 1, longitude: 2, climateDescription: 'humid' })
    ).toBeTruthy();
    expect(PredictCropYieldActionSchema.parse({ latitude: 1, longitude: 2 })).toBeTruthy();
    expect(
      AdvancedCropAdviceActionSchema.parse({
        crop: 'Wheat',
        latitude: 1,
        longitude: 2,
        climateDescription: 'temperate',
      })
    ).toBeTruthy();
  });

  it('parses scenario and text schemas', () => {
    expect(
      ScenarioAnalysisActionSchema.parse({ latitude: 4, longitude: 5, scenarioDescription: 'warming by 2C' })
    ).toBeTruthy();
    expect(TextToSpeechActionSchema.parse({ text: 'hello' })).toBeTruthy();
  });
});
