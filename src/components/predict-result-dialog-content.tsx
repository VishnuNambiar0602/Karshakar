"use client";

import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { WeatherReport } from '@/components/weather-report';
import type {
  WeatherData,
  CropPlan,
  IrrigationSchedule,
  SoilMoisturePrediction,
  CropYieldPrediction,
  DroughtFloodRisk,
  ScenarioAnalysis,
} from '@/lib/types';

type PredictionType = 'weather' | 'crops' | 'irrigation' | 'soil' | 'yield' | 'risk' | 'scenario';

interface PredictResultDialogContentProps {
  type: PredictionType | null;
  weather: WeatherData | null;
  cropPlan: CropPlan | null;
  irrigationSchedule: IrrigationSchedule | null;
  soilMoisture: SoilMoisturePrediction | null;
  cropYield: CropYieldPrediction | null;
  droughtFloodRisk: DroughtFloodRisk | null;
  scenarioResult: ScenarioAnalysis | null;
  t: (key: string) => string;
}

function getRiskBadgeVariant(riskLevel: 'Low' | 'Medium' | 'High') {
  switch (riskLevel) {
    case 'Low':
      return 'default';
    case 'Medium':
      return 'secondary';
    case 'High':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function PredictResultDialogContent({
  type,
  weather,
  cropPlan,
  irrigationSchedule,
  soilMoisture,
  cropYield,
  droughtFloodRisk,
  scenarioResult,
  t,
}: PredictResultDialogContentProps) {
  if (!type) {
    return null;
  }

  switch (type) {
    case 'scenario':
      if (!scenarioResult) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('predict.result.scenario.title')}</DialogTitle>
            <DialogDescription>{scenarioResult.scenario}</DialogDescription>
          </DialogHeader>
          <div>
            <h4 className="font-semibold">{t('predict.result.scenario.impact')}</h4>
            <p className="text-muted-foreground">{scenarioResult.likelyImpact}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.yield.confidence')}</h4>
            <p className="text-muted-foreground">{(scenarioResult.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      );
    case 'weather':
      if (!weather) return null;
      return <WeatherReport weather={weather} showForecast={true} />;
    case 'risk':
      if (!droughtFloodRisk) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('predict.result.risk.title')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-muted-foreground">{t('predict.result.risk.drought')}</h4>
              <Badge variant={getRiskBadgeVariant(droughtFloodRisk.droughtRisk)} className="mt-2 text-2xl">
                {droughtFloodRisk.droughtRisk}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground">{t('predict.result.risk.flood')}</h4>
              <Badge variant={getRiskBadgeVariant(droughtFloodRisk.floodRisk)} className="mt-2 text-2xl">
                {droughtFloodRisk.floodRisk}
              </Badge>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.risk.summary')}</h4>
            <p className="text-muted-foreground">{droughtFloodRisk.summary}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.yield.confidence')}</h4>
            <p className="text-muted-foreground">{(droughtFloodRisk.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      );
    case 'crops':
      if (!cropPlan) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('predict.result.cropPlan.title')}</DialogTitle>
          </DialogHeader>
          <div>
            <h4 className="font-semibold">{t('predict.result.cropPlan.plantingWindow')}</h4>
            <p className="text-muted-foreground">
              {cropPlan.plantingWindow.start} to {cropPlan.plantingWindow.end}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.cropPlan.suitableCrops')}</h4>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {cropPlan.suitableCrops.map((crop) => (
                <li key={crop.name}>
                  <strong>{crop.name}:</strong> {crop.reason}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.cropPlan.cooperativeFarming')}</h4>
            <p className="text-muted-foreground">{cropPlan.cooperativeFarmingSuggestion}</p>
          </div>
        </div>
      );
    case 'irrigation':
      if (!irrigationSchedule) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('predict.result.irrigation.title')}</DialogTitle>
          </DialogHeader>
          <div>
            <h4 className="font-semibold">{t('predict.result.irrigation.recommendation')}</h4>
            <p className="text-2xl font-bold text-primary">{irrigationSchedule.recommendation}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.irrigation.nextDate')}</h4>
            <p className="text-muted-foreground">
              {new Date(irrigationSchedule.nextIrrigationDate).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.irrigation.wateringDepth')}</h4>
            <p className="text-muted-foreground">{irrigationSchedule.wateringDepthInches} inches</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.irrigation.notes')}</h4>
            <p className="text-muted-foreground">{irrigationSchedule.notes}</p>
          </div>
        </div>
      );
    case 'soil':
      if (!soilMoisture) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('predict.result.soil.title')}</DialogTitle>
          </DialogHeader>
          <div>
            <h4 className="font-semibold">{t('predict.result.soil.vwc')}</h4>
            <p className="text-2xl font-bold text-primary">{soilMoisture.volumetricWaterContent.toFixed(1)}%</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.soil.summary')}</h4>
            <p className="text-muted-foreground">{soilMoisture.summary}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.soil.confidence')}</h4>
            <p className="text-muted-foreground">{(soilMoisture.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      );
    case 'yield':
      if (!cropYield) return null;
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t('predict.result.yield.title')}: {cropYield.crop}
            </DialogTitle>
          </DialogHeader>
          <div>
            <h4 className="font-semibold">{t('predict.result.yield.predictedYield')}</h4>
            <p className="text-2xl font-bold text-primary">
              {cropYield.predictedYield.toFixed(2)} {t('predict.result.yield.unit')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.yield.notes')}</h4>
            <p className="text-muted-foreground">{cropYield.notes}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('predict.result.yield.confidence')}</h4>
            <p className="text-muted-foreground">{(cropYield.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}
