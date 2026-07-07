import type { CostGuardrailConfig } from './types';

export const defaultCostGuardrails: CostGuardrailConfig = {
  monthlyBudgetUsd: 1200,
  forecastAlertThresholdRatio: 0.8,
  hardStopThresholdRatio: 1,
  gcsRetentionDays: 30,
  maxDailyRunCount: 6,
};

export interface CostStatus {
  shouldAlert: boolean;
  shouldBlock: boolean;
  message: string;
}

export function evaluateCostGuardrail(
  spendToDateUsd: number,
  forecastMonthEndUsd: number,
  dailyRunCount: number,
  config: CostGuardrailConfig = defaultCostGuardrails
): CostStatus {
  if (dailyRunCount > config.maxDailyRunCount) {
    return {
      shouldAlert: true,
      shouldBlock: true,
      message: `Daily run limit exceeded (${dailyRunCount}/${config.maxDailyRunCount}).`,
    };
  }

  const alertThreshold = config.monthlyBudgetUsd * config.forecastAlertThresholdRatio;
  const blockThreshold = config.monthlyBudgetUsd * config.hardStopThresholdRatio;

  if (forecastMonthEndUsd >= blockThreshold || spendToDateUsd >= blockThreshold) {
    return {
      shouldAlert: true,
      shouldBlock: true,
      message: `Budget hard stop reached. spend=${spendToDateUsd}, forecast=${forecastMonthEndUsd}, budget=${config.monthlyBudgetUsd}`,
    };
  }

  if (forecastMonthEndUsd >= alertThreshold || spendToDateUsd >= alertThreshold) {
    return {
      shouldAlert: true,
      shouldBlock: false,
      message: `Budget alert threshold reached. spend=${spendToDateUsd}, forecast=${forecastMonthEndUsd}, budget=${config.monthlyBudgetUsd}`,
    };
  }

  return {
    shouldAlert: false,
    shouldBlock: false,
    message: 'Cost guardrails within limits.',
  };
}
