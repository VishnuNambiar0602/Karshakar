"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ImageWithLoader } from '@/components/image-with-loader';
import type { AnalysisResult } from '@/lib/types';
import { downloadFile } from '@/lib/csv';

interface GISDashboardProps {
  analysisResult: AnalysisResult;
  locationLabel: string;
}

type OverlayLayer = 'base' | 'segmentation' | 'anomaly';

const CLASS_COLORS = ['#9ca3af', '#22c55e', '#ef4444', '#3b82f6'];

function makeSegmentationOverlay(mask: number[], width: number, height: number, opacity = 0.45): string {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const cells = mask
    .map((classId, idx) => {
      const x = idx % safeWidth;
      const y = Math.floor(idx / safeWidth);
      const fill = CLASS_COLORS[classId] ?? CLASS_COLORS[0];
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}" fill-opacity="${opacity}" />`;
    })
    .join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeWidth} ${safeHeight}" preserveAspectRatio="none">${cells}</svg>`)}`;
}

function makeAnomalyHeatmapData(changeMagnitude: number, temporalIndex: number): number[] {
  const size = 16;
  const data: number[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = Math.sin((x + temporalIndex) * 0.45) + Math.cos((y + temporalIndex) * 0.35);
      const radial = Math.sqrt((x - 8) * (x - 8) + (y - 8) * (y - 8)) / 11;
      const score = Math.max(0, Math.min(1, 0.3 + changeMagnitude * 0.5 + wave * 0.1 - radial * 0.18));
      data.push(score);
    }
  }

  return data;
}

function makeGeoJsonArtifact(analysisResult: AnalysisResult, locationLabel: string): string {
  const properties = {
    location: locationLabel,
    vegetationChange: analysisResult.landCover.vegetation.percentageChange,
    waterChange: analysisResult.landCover.water.percentageChange,
    builtUpChange: analysisResult.landCover.builtUp.percentageChange,
    otherChange: analysisResult.landCover.other.percentageChange,
    segmentationConfidence: analysisResult.segmentationInference?.meanConfidence ?? null,
    generatedAt: new Date().toISOString(),
  };

  const geo = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.2, 40.6],
            [-73.8, 40.6],
            [-73.8, 40.9],
            [-74.2, 40.9],
            [-74.2, 40.6],
          ]],
        },
        properties,
      },
    ],
  };

  return JSON.stringify(geo, null, 2);
}

export function GISDashboard({ analysisResult, locationLabel }: GISDashboardProps) {
  const [overlayLayer, setOverlayLayer] = useState<OverlayLayer>('base');
  const [comparePosition, setComparePosition] = useState(50);
  const [temporalIndex, setTemporalIndex] = useState(0);

  const temporalSteps = Math.max(analysisResult.timeSeries.NDVI.length - 1, 1);
  const segmentation = analysisResult.segmentationInference;

  const segmentationOverlay = useMemo(() => {
    if (!segmentation) {
      return null;
    }

    return makeSegmentationOverlay(segmentation.mask, segmentation.width, segmentation.height, 0.5);
  }, [segmentation]);

  const totalChangeMagnitude = useMemo(() => {
    const changes = [
      Math.abs(analysisResult.landCover.vegetation.percentageChange),
      Math.abs(analysisResult.landCover.water.percentageChange),
      Math.abs(analysisResult.landCover.builtUp.percentageChange),
      Math.abs(analysisResult.landCover.other.percentageChange),
    ];

    const avg = changes.reduce((sum, value) => sum + value, 0) / changes.length;
    return Math.max(0, Math.min(1, avg / 100));
  }, [analysisResult]);

  const anomalyGrid = useMemo(() => makeAnomalyHeatmapData(totalChangeMagnitude, temporalIndex), [totalChangeMagnitude, temporalIndex]);

  const selectedDate = analysisResult.timeSeries.NDVI[Math.min(temporalIndex, analysisResult.timeSeries.NDVI.length - 1)]?.date;

  const handleExportGeoJson = () => {
    downloadFile(makeGeoJsonArtifact(analysisResult, locationLabel), 'land-cover-artifact.geojson', 'application/geo+json');
  };

  const handleExportRasterSummary = () => {
    const summary = {
      layer: overlayLayer,
      comparePosition,
      temporalIndex,
      selectedDate,
      segmentationConfidence: segmentation?.meanConfidence ?? null,
      timestamp: new Date().toISOString(),
    };

    downloadFile(JSON.stringify(summary, null, 2), 'gis-raster-summary.json', 'application/json');
  };

  const handleExportCsv = () => {
    const rows = [
      ['class', 'startArea', 'endArea', 'percentageChange'],
      ['vegetation', String(analysisResult.landCover.vegetation.startArea), String(analysisResult.landCover.vegetation.endArea), String(analysisResult.landCover.vegetation.percentageChange)],
      ['water', String(analysisResult.landCover.water.startArea), String(analysisResult.landCover.water.endArea), String(analysisResult.landCover.water.percentageChange)],
      ['builtUp', String(analysisResult.landCover.builtUp.startArea), String(analysisResult.landCover.builtUp.endArea), String(analysisResult.landCover.builtUp.percentageChange)],
      ['other', String(analysisResult.landCover.other.startArea), String(analysisResult.landCover.other.endArea), String(analysisResult.landCover.other.percentageChange)],
    ];

    downloadFile(rows.map((row) => row.join(',')).join('\n'), 'gis-summary.csv', 'text/csv');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GIS Explorer</CardTitle>
        <CardDescription>
          Region-level spatial comparison with segmentation overlays, temporal inspection, anomaly heatmap, and exports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Overlay layers">
          <Button variant={overlayLayer === 'base' ? 'default' : 'outline'} onClick={() => setOverlayLayer('base')} aria-pressed={overlayLayer === 'base'}>
            Base
          </Button>
          <Button
            variant={overlayLayer === 'segmentation' ? 'default' : 'outline'}
            onClick={() => setOverlayLayer('segmentation')}
            aria-pressed={overlayLayer === 'segmentation'}
            disabled={!segmentationOverlay}
          >
            Segmentation
          </Button>
          <Button variant={overlayLayer === 'anomaly' ? 'default' : 'outline'} onClick={() => setOverlayLayer('anomaly')} aria-pressed={overlayLayer === 'anomaly'}>
            Change Heatmap
          </Button>
          {segmentation && <Badge variant="secondary">Mean confidence: {(segmentation.meanConfidence * 100).toFixed(1)}%</Badge>}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">Before/After Compare</div>
            <div className="relative aspect-video overflow-hidden rounded-lg border" aria-label="Before and after map comparison">
              <ImageWithLoader src={analysisResult.landCover.beforeMapUrl} alt="Baseline land cover map" />
              <div
                className="absolute inset-y-0 right-0 overflow-hidden"
                style={{ width: `${100 - comparePosition}%` }}
                aria-hidden="true"
              >
                <ImageWithLoader src={analysisResult.landCover.afterMapUrl} alt="Current land cover map" />
              </div>
              {overlayLayer === 'segmentation' && segmentationOverlay && (
                <div className="pointer-events-none absolute inset-0">
                  <ImageWithLoader src={segmentationOverlay} alt="Segmentation overlay layer" className="mix-blend-multiply" />
                </div>
              )}
              {overlayLayer === 'anomaly' && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-red-600/20 via-amber-300/20 to-transparent" />
              )}
              <div className="absolute inset-y-0" style={{ left: `${comparePosition}%` }} aria-hidden="true">
                <div className="h-full w-0.5 bg-white/80" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="compare-slider" className="text-sm">Comparison slider: {comparePosition}%</label>
              <input
                id="compare-slider"
                type="range"
                min={0}
                max={100}
                value={comparePosition}
                onChange={(event) => setComparePosition(Number(event.target.value))}
                className="w-full"
                aria-label="Before and after comparison slider"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Temporal Change Inspector</div>
              <Badge variant="outline">{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'No date'}</Badge>
            </div>
            <Slider
              value={[temporalIndex]}
              min={0}
              max={temporalSteps}
              step={1}
              onValueChange={(value) => setTemporalIndex(value[0] ?? 0)}
              aria-label="Temporal slider"
            />
            <div className="grid grid-cols-2 gap-1 rounded-md border p-2 sm:grid-cols-4" role="img" aria-label="Anomaly heatmap grid">
              {anomalyGrid.map((value, index) => (
                <div
                  key={`cell-${index}`}
                  className="aspect-square rounded-sm"
                  style={{ backgroundColor: `rgba(239, 68, 68, ${value})` }}
                  title={`Anomaly intensity ${(value * 100).toFixed(1)}%`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Heatmap intensity combines temporal index and aggregate land-cover change magnitude to highlight potential anomaly clusters.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv} aria-label="Export GIS summary as CSV">Export CSV</Button>
          <Button variant="outline" onClick={handleExportGeoJson} aria-label="Export geospatial artifact as GeoJSON">Export GeoJSON</Button>
          <Button variant="outline" onClick={handleExportRasterSummary} aria-label="Export raster summary JSON">Export Raster Summary</Button>
        </div>
      </CardContent>
    </Card>
  );
}
