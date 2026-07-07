import type { EvaluationMetrics } from './types';

function uniqueClasses(yTrue: number[], yPred: number[]): number[] {
  return [...new Set([...yTrue, ...yPred])].sort((a, b) => a - b);
}

export function computeEvaluationMetrics(yTrue: number[], yPred: number[]): EvaluationMetrics {
  if (yTrue.length !== yPred.length) {
    throw new Error('Prediction and label vectors must be the same length.');
  }

  const classes = uniqueClasses(yTrue, yPred);
  const iouByClass: Record<number, number> = {};
  const diceByClass: Record<number, number> = {};

  let correct = 0;

  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === yPred[i]) {
      correct += 1;
    }
  }

  for (const classId of classes) {
    let intersection = 0;
    let union = 0;
    let predCount = 0;
    let truthCount = 0;

    for (let i = 0; i < yTrue.length; i++) {
      const truth = yTrue[i] === classId;
      const pred = yPred[i] === classId;

      if (truth && pred) {
        intersection += 1;
      }
      if (truth || pred) {
        union += 1;
      }
      if (pred) {
        predCount += 1;
      }
      if (truth) {
        truthCount += 1;
      }
    }

    iouByClass[classId] = union === 0 ? 1 : intersection / union;
    const diceDen = predCount + truthCount;
    diceByClass[classId] = diceDen === 0 ? 1 : (2 * intersection) / diceDen;
  }

  const iouValues = Object.values(iouByClass);

  return {
    mIoU: iouValues.length === 0 ? 0 : iouValues.reduce((sum, value) => sum + value, 0) / iouValues.length,
    pixelAccuracy: yTrue.length === 0 ? 0 : correct / yTrue.length,
    perClass: {
      iou: iouByClass,
      dice: diceByClass,
    },
  };
}
