import type { UNetConfig } from './types';

export interface UNetLayer {
  name: string;
  type: 'conv' | 'pool' | 'upconv' | 'concat' | 'output';
  filters: number;
  stride?: number;
  kernelSize?: number;
  skipFrom?: string;
}

export interface UNetBlueprint {
  config: UNetConfig;
  layers: UNetLayer[];
}

export function buildUNetBlueprint(config: UNetConfig): UNetBlueprint {
  const layers: UNetLayer[] = [];
  const encoderNames: string[] = [];

  for (let depth = 0; depth < config.encoderDepth; depth++) {
    const filters = config.baseFilters * Math.pow(2, depth);
    const blockName = `enc_${depth}`;
    layers.push({ name: `${blockName}_conv1`, type: 'conv', filters, kernelSize: 3 });
    layers.push({ name: `${blockName}_conv2`, type: 'conv', filters, kernelSize: 3 });
    encoderNames.push(`${blockName}_conv2`);
    if (depth < config.encoderDepth - 1) {
      layers.push({ name: `${blockName}_pool`, type: 'pool', filters, stride: 2 });
    }
  }

  for (let depth = config.encoderDepth - 2; depth >= 0; depth--) {
    const filters = config.baseFilters * Math.pow(2, depth);
    const blockName = `dec_${depth}`;
    const skipSource = encoderNames[depth];
    layers.push({ name: `${blockName}_up`, type: 'upconv', filters, stride: 2 });
    layers.push({ name: `${blockName}_concat`, type: 'concat', filters, skipFrom: skipSource });
    layers.push({ name: `${blockName}_conv1`, type: 'conv', filters, kernelSize: 3 });
    layers.push({ name: `${blockName}_conv2`, type: 'conv', filters, kernelSize: 3 });
  }

  layers.push({ name: 'head_output', type: 'output', filters: config.numClasses, kernelSize: 1 });

  return { config, layers };
}
