type MoistureLevel = 'Dry' | 'Optimal' | 'Wet';

type YieldInput = {
  cropType: string;
  avgTemperatureC: number;
  totalPrecipitationMm: number;
  soilMoisture: number;
  soilType: string;
};

type RiskInput = {
  averagePrecipitationMm: number;
  currentMoistureLevel: MoistureLevel;
};

const CROP_BASELINE_TON_HA: Record<string, number> = {
  maize: 9.5,
  corn: 9.5,
  wheat: 4.2,
  rice: 5.1,
  soybeans: 3.1,
  cotton: 2.2,
  potatoes: 26,
  tomatoes: 48,
  barley: 3.7,
  sorghum: 3.2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function predictYieldClassical(input: YieldInput): { predictedYield: number; confidence: number; signals: string[] } {
  const cropKey = input.cropType.toLowerCase();
  const baseline = CROP_BASELINE_TON_HA[cropKey] ?? 4.5;

  const tempScore = 1 - Math.min(Math.abs(input.avgTemperatureC - 22) / 18, 0.6);
  const precipScore = clamp(input.totalPrecipitationMm / 450, 0.45, 1.2);
  const moistureScore = clamp(input.soilMoisture / 0.28, 0.5, 1.3);

  const soilBoost = input.soilType.toLowerCase().includes('loam')
    ? 1.08
    : input.soilType.toLowerCase().includes('clay')
      ? 0.95
      : 0.9;

  const multiplier = tempScore * precipScore * moistureScore * soilBoost;
  const predictedYield = clamp(baseline * multiplier, baseline * 0.45, baseline * 1.35);

  const confidence = clamp(0.62 + tempScore * 0.12 + moistureScore * 0.08, 0.55, 0.9);
  const signals = [
    `temperature_score=${tempScore.toFixed(2)}`,
    `precipitation_score=${precipScore.toFixed(2)}`,
    `moisture_score=${moistureScore.toFixed(2)}`,
    `soil_boost=${soilBoost.toFixed(2)}`,
  ];

  return {
    predictedYield: Number(predictedYield.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    signals,
  };
}

function riskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 0.72) return 'High';
  if (score >= 0.46) return 'Medium';
  return 'Low';
}

export function predictDroughtFloodClassical(input: RiskInput): {
  droughtRisk: 'Low' | 'Medium' | 'High';
  floodRisk: 'Low' | 'Medium' | 'High';
  confidence: number;
  signals: string[];
} {
  const moisturePenalty = input.currentMoistureLevel === 'Dry' ? 0.28 : input.currentMoistureLevel === 'Optimal' ? 0.12 : 0;
  const moistureFloodBoost = input.currentMoistureLevel === 'Wet' ? 0.28 : input.currentMoistureLevel === 'Optimal' ? 0.12 : 0;

  const precipitationNorm = clamp(input.averagePrecipitationMm / 600, 0, 1.4);
  const droughtScore = clamp(1 - precipitationNorm + moisturePenalty, 0, 1);
  const floodScore = clamp(precipitationNorm - 0.55 + moistureFloodBoost, 0, 1);

  const confidence = clamp(0.6 + Math.abs(droughtScore - floodScore) * 0.25, 0.55, 0.88);

  return {
    droughtRisk: riskLevel(droughtScore),
    floodRisk: riskLevel(floodScore),
    confidence: Number(confidence.toFixed(2)),
    signals: [
      `precipitation_norm=${precipitationNorm.toFixed(2)}`,
      `drought_score=${droughtScore.toFixed(2)}`,
      `flood_score=${floodScore.toFixed(2)}`,
      `moisture=${input.currentMoistureLevel}`,
    ],
  };
}
